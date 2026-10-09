import type { Prisma } from "../../generated/prisma/client.js"
import { AppError } from "../../platform/errors.js"
import prismaClient from "../../platform/prisma.js"
import { ensureBillingCatalog } from "../billing/catalog.js"
import { expireLapsedSubscriptions } from "../billing/limits.js"
import { isEntitlementUnexpired } from "../billing/period.js"
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
    type AnalyticsRange,
    type ModelUsageRow,
    RECENT_REQUESTS_LIMIT,
    startOfAnalyticsRange,
    startOfNextUtcDay,
    startOfUtcMonth,
} from "./aggregate.js"

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

function serializePeriod(period: {
    requestsUsed: number
    tokensUsed: number
    successfulRequests: number
    failedRequests: number
    periodStart: Date
}) {
    return {
        requestsUsed: period.requestsUsed,
        tokensUsed: period.tokensUsed,
        successfulRequests: period.successfulRequests,
        failedRequests: period.failedRequests,
        periodStart: period.periodStart.toISOString(),
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
 */
async function getPlanSnapshot(organizationId: string) {
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

    if (subscriptions.length === 0) {
        return null
    }

    const unexpiredActive = subscriptions.find(
        (s) =>
            (s.status === "ACTIVE" || s.status === "PAST_DUE") &&
            isEntitlementUnexpired(s.expiresAt),
    )
    const pending = subscriptions.find((s) => s.status === "PENDING")
    const expired = subscriptions.find((s) => s.status === "EXPIRED")
    const subscription = unexpiredActive ?? pending ?? expired ?? subscriptions[0]

    if (!subscription) {
        return null
    }

    return {
        planName: subscription.plan.name,
        status: subscription.status,
        billingMode: subscription.plan.billingMode,
        requestLimit: subscription.plan.requestLimit,
        tokenLimit: subscription.plan.tokenLimit,
        expiresAt: subscription.expiresAt ? subscription.expiresAt.toISOString() : null,
    }
}

class UsageService {
    async getOrganizationUsage(organizationId: string, userId: string) {
        const membership = await prismaClient.organizationMember.findUnique({
            where: {
                organizationId_userId: { organizationId, userId },
            },
        })
        if (!membership) {
            throw new AppError(403, "FORBIDDEN", "You are not a member of this organization")
        }

        const periodStart = startOfUtcMonth()

        const [plan, period, projects, byProject, byModel, daily, dailyByProject, dailyByModel, recentRows] =
            await Promise.all([
            getPlanSnapshot(organizationId),
            aggregatePeriodUsage({ organizationId }, periodStart),
            prismaClient.project.findMany({
                where: { organizationId },
                orderBy: { createdAt: "desc" },
            }),
            aggregateOrgUsageByProject(organizationId, periodStart),
            aggregateOrgUsageByModel(organizationId, periodStart),
            aggregateDailyUsage({ organizationId }, periodStart),
            aggregateDailyUsageByProject(organizationId, periodStart),
            aggregateDailyUsageByModel({ organizationId }, periodStart),
            prismaClient.aIRequest.findMany({
                where: { project: { organizationId } },
                include: {
                    ...requestInclude,
                    project: { select: { name: true } },
                },
                orderBy: { createdAt: "desc" },
                take: RECENT_REQUESTS_LIMIT,
            }),
        ])

        const usageByProjectId = new Map(byProject.map((row) => [row.projectId, row]))
        const tokenLimit = plan?.tokenLimit ?? 0

        return {
            plan,
            period: serializePeriod(period),
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
        const periodStart = startOfUtcMonth()

        const [
            period,
            organizationPeriod,
            keyCounts,
            byModel,
            daily,
            organizationDaily,
            recentRows,
            plan,
        ] = await Promise.all([
            aggregateProjectPeriodUsage(projectId, periodStart),
            aggregatePeriodUsage({ organizationId: project.organizationId }, periodStart),
            prismaClient.apiKey.groupBy({
                by: ["status"],
                where: { projectId },
                _count: { _all: true },
            }),
            aggregateProjectUsageByModel(projectId, periodStart),
            aggregateDailyUsage({ projectId }, periodStart),
            aggregateDailyUsage(
                { organizationId: project.organizationId },
                periodStart,
            ),
            prismaClient.aIRequest.findMany({
                where: { projectId },
                include: requestInclude,
                orderBy: { createdAt: "desc" },
                take: RECENT_REQUESTS_LIMIT,
            }),
            getPlanSnapshot(project.organizationId),
        ])

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
                ...serializePeriod(period),
                avgLatency: period.avgLatency,
            },
            organizationPeriod: serializePeriod(organizationPeriod),
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

    async getProjectAnalytics(projectId: string, userId: string, range: AnalyticsRange) {
        const project = await projectsService.getProjectForMember(projectId, userId)
        const now = new Date()
        const periodStart = startOfAnalyticsRange(range, now)

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
            plan,
        ] = await Promise.all([
            aggregatePeriodUsage({ projectId }, periodStart, now),
            aggregateProjectLatency(projectId, periodStart, now),
            aggregatePeriodUsage({ organizationId: project.organizationId }, periodStart, now),
            aggregateProjectUsageByModel(projectId, periodStart, now),
            aggregateProjectUsageByApiKey(projectId, periodStart, now),
            aggregateDailyUsage({ projectId }, periodStart, now),
            aggregateDailyUsageByModel({ projectId }, periodStart, now),
            aggregateDailyUsageByApiKey(projectId, periodStart, now),
            prismaClient.aIRequest.findMany({
                where: {
                    projectId,
                    createdAt: { gte: periodStart, lt: startOfNextUtcDay(now) },
                },
                include: requestInclude,
                orderBy: { createdAt: "desc" },
                take: ANALYTICS_RECENT_REQUESTS_LIMIT,
            }),
            getPlanSnapshot(project.organizationId),
        ])

        return {
            range,
            project: {
                id: project.id,
                organizationId: project.organizationId,
                name: project.name,
            },
            plan,
            period: {
                ...serializePeriod(period),
                inputTokens: period.inputTokens,
                outputTokens: period.outputTokens,
                totalCost: period.totalCost,
            },
            latency,
            organizationPeriod: serializePeriod(organizationPeriod),
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
