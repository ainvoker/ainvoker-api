import type { Prisma } from "../../generated/prisma/client.js"
import prismaClient from "../../platform/prisma.js"

export const RECENT_REQUESTS_LIMIT = 10

/** Statuses that count toward monthly request/token quotas (matches billing limits). */
const QUOTA_STATUSES = ["PENDING", "SUCCESS", "FAILED"] as const

export type PeriodUsage = {
    requestsUsed: number
    tokensUsed: number
    successfulRequests: number
    failedRequests: number
    periodStart: Date
}

export type ProjectPeriodUsage = PeriodUsage & {
    avgLatency: number | null
}

export function startOfUtcMonth(now = new Date()): Date {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0))
}

function periodWhere(
    scope: { organizationId: string } | { projectId: string },
    periodStart: Date,
): Prisma.AIRequestWhereInput {
    const base: Prisma.AIRequestWhereInput =
        "organizationId" in scope
            ? { project: { organizationId: scope.organizationId } }
            : { projectId: scope.projectId }

    return {
        ...base,
        createdAt: { gte: periodStart },
    }
}

export async function aggregatePeriodUsage(
    scope: { organizationId: string } | { projectId: string },
    periodStart = startOfUtcMonth(),
): Promise<PeriodUsage> {
    const where = periodWhere(scope, periodStart)

    const [quotaAgg, successfulRequests, failedRequests] = await Promise.all([
        prismaClient.aIRequest.aggregate({
            where: {
                ...where,
                requestStatus: { in: [...QUOTA_STATUSES] },
            },
            _count: { _all: true },
            _sum: { totalTokens: true },
        }),
        prismaClient.aIRequest.count({
            where: { ...where, requestStatus: "SUCCESS" },
        }),
        prismaClient.aIRequest.count({
            where: { ...where, requestStatus: { in: ["FAILED", "REJECTED"] } },
        }),
    ])

    return {
        requestsUsed: quotaAgg._count._all,
        tokensUsed: quotaAgg._sum.totalTokens ?? 0,
        successfulRequests,
        failedRequests,
        periodStart,
    }
}

export async function aggregateProjectPeriodUsage(
    projectId: string,
    periodStart = startOfUtcMonth(),
): Promise<ProjectPeriodUsage> {
    const where = periodWhere({ projectId }, periodStart)

    const [period, latencyAgg] = await Promise.all([
        aggregatePeriodUsage({ projectId }, periodStart),
        prismaClient.aIRequest.aggregate({
            where: {
                ...where,
                requestStatus: "SUCCESS",
                latency: { not: null },
            },
            _avg: { latency: true },
        }),
    ])

    const avg = latencyAgg._avg.latency
    return {
        ...period,
        avgLatency: avg == null ? null : Math.round(avg),
    }
}

export type ProjectUsageRow = {
    projectId: string
    requestsUsed: number
    tokensUsed: number
}

/** Per-project request/token totals for the billing period (quota statuses only). */
export async function aggregateOrgUsageByProject(
    organizationId: string,
    periodStart = startOfUtcMonth(),
): Promise<ProjectUsageRow[]> {
    const rows = await prismaClient.aIRequest.groupBy({
        by: ["projectId"],
        where: {
            project: { organizationId },
            createdAt: { gte: periodStart },
            requestStatus: { in: [...QUOTA_STATUSES] },
        },
        _count: { _all: true },
        _sum: { totalTokens: true },
    })

    return rows.map((row) => ({
        projectId: row.projectId,
        requestsUsed: row._count._all,
        tokensUsed: row._sum.totalTokens ?? 0,
    }))
}

export type ModelUsageRow = {
    modelId: number
    model: string
    requestsUsed: number
    tokensUsed: number
}

/** Per-model request/token totals for the billing period (quota statuses only). */
export async function aggregateOrgUsageByModel(
    organizationId: string,
    periodStart = startOfUtcMonth(),
): Promise<ModelUsageRow[]> {
    const rows = await prismaClient.aIRequest.groupBy({
        by: ["modelId"],
        where: {
            project: { organizationId },
            createdAt: { gte: periodStart },
            requestStatus: { in: [...QUOTA_STATUSES] },
        },
        _count: { _all: true },
        _sum: { totalTokens: true },
        orderBy: { _sum: { totalTokens: "desc" } },
    })

    if (rows.length === 0) {
        return []
    }

    const models = await prismaClient.aIModel.findMany({
        where: { id: { in: rows.map((row) => row.modelId) } },
        select: {
            id: true,
            name: true,
            provider: { select: { name: true } },
        },
    })
    const modelById = new Map(models.map((m) => [m.id, m]))

    return rows.map((row) => {
        const model = modelById.get(row.modelId)
        return {
            modelId: row.modelId,
            model: model ? `${model.provider.name}/${model.name}` : `model:${row.modelId}`,
            requestsUsed: row._count._all,
            tokensUsed: row._sum.totalTokens ?? 0,
        }
    })
}
