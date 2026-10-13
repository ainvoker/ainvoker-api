import type { Prisma } from "../../generated/prisma/client.js"
import { AppError } from "../../platform/errors.js"
import prismaClient from "../../platform/prisma.js"
import { ensureBillingCatalog } from "../billing/catalog.js"
import { expireLapsedSubscriptions } from "../billing/limits.js"
import {
    isEntitlementUnexpired,
    monthsOverlapping,
    quotaPeriodForSubscription,
} from "../billing/period.js"
import projectsService from "../projects/service.js"
import {
    aggregateDailyUsage,
    aggregateDailyUsageByApiKey,
    aggregateDailyUsageByModel,
    aggregateDailyUsageByProject,
    aggregateOrgUsageByModel,
    aggregateOrgUsageByProject,
    aggregatePeriodUsage,
    aggregateProjectLatency,
    aggregateProjectPeriodUsage,
    aggregateProjectUsageByApiKey,
    aggregateProjectUsageByModel,
    type ModelUsageRow,
    RECENT_REQUESTS_LIMIT,
    startOfNextUtcDay,
} from "./aggregate.js"
import type { UsageRangeQuery } from "./schemas.js"
import { resolveUsageWindow, type UsageWindow } from "./window.js"

const ANALYTICS_RECENT_REQUESTS_LIMIT = 25

type AiRequestWithRelations = {
    id: string
    projectId: string
    apiKeyId: string
    modelId: number
    serviceType: string
    inputTokens: number | null
    outputTokens: number | null
    totalTokens: number | null
    latency: number | null
    requestCost: Prisma.Decimal | null
    requestStatus: string
    createdAt: Date
    model: {
        name: string
        provider: { name: string }
    }
    apiKey: {
        keyName: string
        keyPrefix: string
    }
    project?: {
        name: string
    }
}

const requestInclude = {
    model: {
        select: {
            name: true,
            provider: { select: { name: true } },
        },
    },
    apiKey: {
        select: {
            keyName: true,
            keyPrefix: true,
        },
    },
} as const

function serializeRequestSummary(row: AiRequestWithRelations, includeProjectName: boolean) {
    const base = {
        id: row.id,
        projectId: row.projectId,
        apiKeyId: row.apiKeyId,
        apiKeyName: row.apiKey.keyName,
        apiKeyPrefix: row.apiKey.keyPrefix,
        model: `${row.model.provider.name}/${row.model.name}`,
        serviceType: row.serviceType,
        requestStatus: row.requestStatus,
        inputTokens: row.inputTokens,
        outputTokens: row.outputTokens,
        totalTokens: row.totalTokens,
        latency: row.latency,
        requestCost: row.requestCost?.toString() ?? null,
        createdAt: row.createdAt.toISOString(),
    }

    if (!includeProjectName) {
        return base
    }

    return {
        ...base,
        projectName: row.project?.name ?? null,
    }
}

function serializePeriod(
    period: {
        requestsUsed: number
        tokensUsed: number
        successfulRequests: number
        failedRequests: number
        periodStart: Date
    },
    periodEnd: Date,
) {
    return {
        requestsUsed: period.requestsUsed,
        tokensUsed: period.tokensUsed,
        successfulRequests: period.successfulRequests,
        failedRequests: period.failedRequests,
        periodStart: period.periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
    }
}

function serializeModelRows(rows: ModelUsageRow[], tokenLimit: number) {
    return rows.map((row) => ({
        modelId: row.modelId,
        model: row.model,
        requestsUsed: row.requestsUsed,
        tokensUsed: row.tokensUsed,
        percentOfTokenQuota:
            tokenLimit > 0
                ? Math.min(100, Math.round((row.tokensUsed / tokenLimit) * 1000) / 10)
                : null,
    }))
}

/**
 * Soft plan snapshot for dashboards — never throws SUBSCRIPTION_REQUIRED.
 * Limits are zero unless the subscription is entitled (PENDING and lapsed plans
 * have no quota), and the current billing period anchors quota usage.
 */
async function getBillingContext(organizationId: string, now = new Date()) {
    await ensureBillingCatalog()
    await expireLapsedSubscriptions(organizationId)

    const subscriptions = await prismaClient.subscription.findMany({
        where: {
            organizationId,
            status: { in: ["PENDING", "ACTIVE", "PAST_DUE", "EXPIRED"] },
        },
        include: { plan: true },
        orderBy: { startedAt: "desc" },
    })

    const entitled = subscriptions.find(
        (s) =>
            (s.status === "ACTIVE" || s.status === "PAST_DUE") &&
            isEntitlementUnexpired(s.expiresAt, now),
    )
    const pending = subscriptions.find((s) => s.status === "PENDING")
    const expired = subscriptions.find((s) => s.status === "EXPIRED")
    const subscription = entitled ?? pending ?? expired ?? subscriptions[0]
    const currentPeriod = entitled ? quotaPeriodForSubscription(entitled, now) : null

    const availableMonths = monthsOverlapping(
        subscriptions
            .filter((s) => s.status !== "PENDING")
            .map((s) => ({
                start: s.startedAt,
                end: s.expiresAt ?? (s.status === "EXPIRED" ? s.updatedAt : now),
            })),
    )

    const plan = subscription
        ? {
              planName: subscription.plan.name,
              status: subscription.status,
              billingMode: subscription.plan.billingMode,
              entitled: entitled != null,
              requestLimit: entitled ? subscription.plan.requestLimit : 0,
              tokenLimit: entitled ? subscription.plan.tokenLimit : 0,
              expiresAt: subscription.expiresAt ? subscription.expiresAt.toISOString() : null,
              periodStart: currentPeriod?.periodStart.toISOString() ?? null,
              periodEnd: currentPeriod?.periodEnd.toISOString() ?? null,
          }
        : null

    return { plan, currentPeriod, availableMonths }
}

function windowCreatedAt(window: UsageWindow) {
    return { gte: window.start, lt: startOfNextUtcDay(window.asOf) }
}

class UsageService {
    async getOrganizationUsage(
        organizationId: string,
        userId: string,
        query: UsageRangeQuery = { range: "current_period" },
    ) {
        const membership = await prismaClient.organizationMember.findUnique({
            where: {
                organizationId_userId: { organizationId, userId },
            },
        })
        if (!membership) {
            throw new AppError(403, "FORBIDDEN", "You are not a member of this organization")
        }

        const now = new Date()
        const billing = await getBillingContext(organizationId, now)
        const window = resolveUsageWindow(query, billing.currentPeriod, now)
        const { start, asOf } = window
        const isCurrentPeriod = window.range === "current_period"

        const [
            period,
            otherQuotaPeriod,
            projects,
            byProject,
            byModel,
            daily,
            dailyByProject,
            dailyByModel,
            recentRows,
        ] = await Promise.all([
            aggregatePeriodUsage({ organizationId }, start, asOf),
            !isCurrentPeriod && billing.currentPeriod
                ? aggregatePeriodUsage({ organizationId }, billing.currentPeriod.periodStart, now)
                : null,
            prismaClient.project.findMany({
                where: { organizationId },
                orderBy: { createdAt: "desc" },
            }),
            aggregateOrgUsageByProject(organizationId, start, asOf),
            aggregateOrgUsageByModel(organizationId, start, asOf),
            aggregateDailyUsage({ organizationId }, start, asOf),
            aggregateDailyUsageByProject(organizationId, start, asOf),
            aggregateDailyUsageByModel({ organizationId }, start, asOf),
            prismaClient.aIRequest.findMany({
                where: { project: { organizationId }, createdAt: windowCreatedAt(window) },
                include: {
                    ...requestInclude,
                    project: { select: { name: true } },
                },
                orderBy: { createdAt: "desc" },
                take: RECENT_REQUESTS_LIMIT,
            }),
        ])

        const quotaPeriod = billing.currentPeriod
            ? (otherQuotaPeriod ?? period)
            : null
        const usageByProjectId = new Map(byProject.map((row) => [row.projectId, row]))
        const plan = billing.plan
        const tokenLimit = plan?.tokenLimit ?? 0

        return {
            plan,
            range: window.range,
            availableMonths: billing.availableMonths,
            quota:
                quotaPeriod && billing.currentPeriod
                    ? serializePeriod(quotaPeriod, billing.currentPeriod.periodEnd)
                    : null,
            period: serializePeriod(period, window.end),
            projects: projects.map((project) => {
                const usage = usageByProjectId.get(project.id)
                return {
                    id: project.id,
                    name: project.name,
                    environment: project.environment,
                    status: project.status,
                    requestsUsed: usage?.requestsUsed ?? 0,
                    tokensUsed: usage?.tokensUsed ?? 0,
                }
            }),
            byModel: serializeModelRows(byModel, tokenLimit),
            daily,
            dailyByProject,
            dailyByModel,
            recentRequests: recentRows.map((row) => serializeRequestSummary(row, true)),
        }
    }

    async getProjectUsage(projectId: string, userId: string) {
        const project = await projectsService.getProjectForMember(projectId, userId)
        const now = new Date()
        const billing = await getBillingContext(project.organizationId, now)
        const window = resolveUsageWindow({ range: "current_period" }, billing.currentPeriod, now)
        const { start, asOf } = window

        const [
            period,
            organizationPeriod,
            keyCounts,
            byModel,
            daily,
            organizationDaily,
            recentRows,
        ] = await Promise.all([
            aggregateProjectPeriodUsage(projectId, start, asOf),
            aggregatePeriodUsage({ organizationId: project.organizationId }, start, asOf),
            prismaClient.apiKey.groupBy({
                by: ["status"],
                where: { projectId },
                _count: { _all: true },
            }),
            aggregateProjectUsageByModel(projectId, start, asOf),
            aggregateDailyUsage({ projectId }, start, asOf),
            aggregateDailyUsage({ organizationId: project.organizationId }, start, asOf),
            prismaClient.aIRequest.findMany({
                where: { projectId },
                include: requestInclude,
                orderBy: { createdAt: "desc" },
                take: RECENT_REQUESTS_LIMIT,
            }),
        ])
        const plan = billing.plan

        let totalKeys = 0
        let activeKeys = 0
        for (const row of keyCounts) {
            totalKeys += row._count._all
            if (row.status === "ACTIVE") {
                activeKeys += row._count._all
            }
        }

        const tokenLimit = plan?.tokenLimit ?? 0

        return {
            project: {
                id: project.id,
                organizationId: project.organizationId,
                name: project.name,
                description: project.description,
                environment: project.environment,
                status: project.status,
                createdAt: project.createdAt.toISOString(),
                updatedAt: project.updatedAt.toISOString(),
            },
            plan,
            period: {
                ...serializePeriod(period, window.end),
                avgLatency: period.avgLatency,
            },
            organizationPeriod: serializePeriod(organizationPeriod, window.end),
            keys: {
                total: totalKeys,
                active: activeKeys,
            },
            byModel: serializeModelRows(byModel, tokenLimit),
            daily,
            organizationDaily,
            recentRequests: recentRows.map((row) => serializeRequestSummary(row, false)),
        }
    }

    async getProjectAnalytics(projectId: string, userId: string, query: UsageRangeQuery) {
        const project = await projectsService.getProjectForMember(projectId, userId)
        const now = new Date()
        const billing = await getBillingContext(project.organizationId, now)
        const window = resolveUsageWindow(query, billing.currentPeriod, now)
        const { start, asOf } = window

        const [
            period,
            latency,
            organizationPeriod,
            byModel,
            byApiKey,
            daily,
            dailyByModel,
            dailyByApiKey,
            recentRows,
        ] = await Promise.all([
            aggregatePeriodUsage({ projectId }, start, asOf),
            aggregateProjectLatency(projectId, start, asOf),
            aggregatePeriodUsage({ organizationId: project.organizationId }, start, asOf),
            aggregateProjectUsageByModel(projectId, start, asOf),
            aggregateProjectUsageByApiKey(projectId, start, asOf),
            aggregateDailyUsage({ projectId }, start, asOf),
            aggregateDailyUsageByModel({ projectId }, start, asOf),
            aggregateDailyUsageByApiKey(projectId, start, asOf),
            prismaClient.aIRequest.findMany({
                where: { projectId, createdAt: windowCreatedAt(window) },
                include: requestInclude,
                orderBy: { createdAt: "desc" },
                take: ANALYTICS_RECENT_REQUESTS_LIMIT,
            }),
        ])
        const plan = billing.plan

        return {
            range: window.range,
            availableMonths: billing.availableMonths,
            project: {
                id: project.id,
                organizationId: project.organizationId,
                name: project.name,
            },
            plan,
            period: {
                ...serializePeriod(period, window.end),
                inputTokens: period.inputTokens,
                outputTokens: period.outputTokens,
                totalCost: period.totalCost,
            },
            latency,
            organizationPeriod: serializePeriod(organizationPeriod, window.end),
            byModel: serializeModelRows(byModel, plan?.tokenLimit ?? 0),
            byApiKey,
            daily,
            dailyByModel,
            dailyByApiKey,
            recentRequests: recentRows.map((row) => serializeRequestSummary(row, false)),
        }
    }
}

export default new UsageService()
