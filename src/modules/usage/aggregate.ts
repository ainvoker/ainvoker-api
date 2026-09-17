import { Prisma, type Prisma as PrismaTypes } from "../../generated/prisma/client.js"
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

export type UsageDailyPoint = {
    date: string
    requestsUsed: number
    tokensUsed: number
    successfulRequests: number
    failedRequests: number
}

export function startOfUtcMonth(now = new Date()): Date {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0))
}

function startOfUtcDay(now = new Date()): Date {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0))
}

function formatUtcDate(date: Date): string {
    return date.toISOString().slice(0, 10)
}

function nextUtcDay(date: Date): Date {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1, 0, 0, 0, 0))
}

/** Exclusive upper bound: usage counted through end of today (UTC), not future-dated rows. */
export function startOfNextUtcDay(now = new Date()): Date {
    return nextUtcDay(startOfUtcDay(now))
}

/** Fill every UTC day from period start through today (inclusive); zeros for quiet days. */
export function fillDailySeries(
    periodStart: Date,
    buckets: Map<string, Omit<UsageDailyPoint, "date">>,
    now = new Date(),
): UsageDailyPoint[] {
    const end = startOfUtcDay(now)
    const points: UsageDailyPoint[] = []
    let cursor = startOfUtcDay(periodStart)

    while (cursor.getTime() <= end.getTime()) {
        const date = formatUtcDate(cursor)
        const bucket = buckets.get(date)
        points.push({
            date,
            requestsUsed: bucket?.requestsUsed ?? 0,
            tokensUsed: bucket?.tokensUsed ?? 0,
            successfulRequests: bucket?.successfulRequests ?? 0,
            failedRequests: bucket?.failedRequests ?? 0,
        })
        cursor = nextUtcDay(cursor)
    }

    return points
}

function periodWhere(
    scope: { organizationId: string } | { projectId: string },
    periodStart: Date,
    now = new Date(),
): PrismaTypes.AIRequestWhereInput {
    const base: PrismaTypes.AIRequestWhereInput =
        "organizationId" in scope
            ? { project: { organizationId: scope.organizationId } }
            : { projectId: scope.projectId }

    return {
        ...base,
        createdAt: { gte: periodStart, lt: startOfNextUtcDay(now) },
    }
}

export async function aggregatePeriodUsage(
    scope: { organizationId: string } | { projectId: string },
    periodStart = startOfUtcMonth(),
    now = new Date(),
): Promise<PeriodUsage> {
    const where = periodWhere(scope, periodStart, now)

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
    now = new Date(),
): Promise<ProjectPeriodUsage> {
    const where = periodWhere({ projectId }, periodStart, now)

    const [period, latencyAgg] = await Promise.all([
        aggregatePeriodUsage({ projectId }, periodStart, now),
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
    now = new Date(),
): Promise<ProjectUsageRow[]> {
    const rows = await prismaClient.aIRequest.groupBy({
        by: ["projectId"],
        where: {
            project: { organizationId },
            createdAt: { gte: periodStart, lt: startOfNextUtcDay(now) },
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

async function resolveModelLabels(rows: { modelId: number }[]): Promise<Map<number, string>> {
    if (rows.length === 0) {
        return new Map()
    }

    const models = await prismaClient.aIModel.findMany({
        where: { id: { in: rows.map((row) => row.modelId) } },
        select: {
            id: true,
            name: true,
            provider: { select: { name: true } },
        },
    })

    return new Map(
        models.map((m) => [m.id, `${m.provider.name}/${m.name}`] as const),
    )
}

/** Per-model request/token totals for the billing period (quota statuses only). */
export async function aggregateOrgUsageByModel(
    organizationId: string,
    periodStart = startOfUtcMonth(),
    now = new Date(),
): Promise<ModelUsageRow[]> {
    const rows = await prismaClient.aIRequest.groupBy({
        by: ["modelId"],
        where: {
            project: { organizationId },
            createdAt: { gte: periodStart, lt: startOfNextUtcDay(now) },
            requestStatus: { in: [...QUOTA_STATUSES] },
        },
        _count: { _all: true },
        _sum: { totalTokens: true },
        orderBy: { _sum: { totalTokens: "desc" } },
    })

    if (rows.length === 0) {
        return []
    }

    const modelById = await resolveModelLabels(rows)

    return rows.map((row) => ({
        modelId: row.modelId,
        model: modelById.get(row.modelId) ?? `model:${row.modelId}`,
        requestsUsed: row._count._all,
        tokensUsed: row._sum.totalTokens ?? 0,
    }))
}

/** Per-model request/token totals for a single project in the billing period. */
export async function aggregateProjectUsageByModel(
    projectId: string,
    periodStart = startOfUtcMonth(),
    now = new Date(),
): Promise<ModelUsageRow[]> {
    const rows = await prismaClient.aIRequest.groupBy({
        by: ["modelId"],
        where: {
            projectId,
            createdAt: { gte: periodStart, lt: startOfNextUtcDay(now) },
            requestStatus: { in: [...QUOTA_STATUSES] },
        },
        _count: { _all: true },
        _sum: { totalTokens: true },
        orderBy: { _sum: { totalTokens: "desc" } },
    })

    if (rows.length === 0) {
        return []
    }

    const modelById = await resolveModelLabels(rows)

    return rows.map((row) => ({
        modelId: row.modelId,
        model: modelById.get(row.modelId) ?? `model:${row.modelId}`,
        requestsUsed: row._count._all,
        tokensUsed: row._sum.totalTokens ?? 0,
    }))
}

type DailyRawRow = {
    day: string
    requests_used: bigint | number
    tokens_used: bigint | number
    successful_requests: bigint | number
    failed_requests: bigint | number
}

function toInt(value: bigint | number | null | undefined): number {
    if (value == null) return 0
    return typeof value === "bigint" ? Number(value) : value
}

/**
 * UTC-day buckets for the billing period through today.
 * Quota statuses for requests/tokens; success/fail use SUCCESS vs FAILED|REJECTED.
 */
export async function aggregateDailyUsage(
    scope: { organizationId: string } | { projectId: string },
    periodStart = startOfUtcMonth(),
    now = new Date(),
): Promise<UsageDailyPoint[]> {
    const scopeFilter =
        "organizationId" in scope
            ? Prisma.sql`p."organizationId" = ${scope.organizationId}`
            : Prisma.sql`r."projectId" = ${scope.projectId}`
    const periodEnd = startOfNextUtcDay(now)

    const rows = await prismaClient.$queryRaw<DailyRawRow[]>`
        SELECT
            to_char(
                date_trunc('day', r."createdAt" AT TIME ZONE 'UTC'),
                'YYYY-MM-DD'
            ) AS day,
            COUNT(*) FILTER (
                WHERE r."requestStatus" IN ('PENDING', 'SUCCESS', 'FAILED')
            )::bigint AS requests_used,
            COALESCE(SUM(r."totalTokens") FILTER (
                WHERE r."requestStatus" IN ('PENDING', 'SUCCESS', 'FAILED')
            ), 0)::bigint AS tokens_used,
            COUNT(*) FILTER (WHERE r."requestStatus" = 'SUCCESS')::bigint AS successful_requests,
            COUNT(*) FILTER (
                WHERE r."requestStatus" IN ('FAILED', 'REJECTED')
            )::bigint AS failed_requests
        FROM "AIRequest" r
        INNER JOIN "Project" p ON p.id = r."projectId"
        WHERE ${scopeFilter}
          AND r."createdAt" >= ${periodStart}
          AND r."createdAt" < ${periodEnd}
        GROUP BY 1
        ORDER BY 1 ASC
    `

    const buckets = new Map<string, Omit<UsageDailyPoint, "date">>()
    for (const row of rows) {
        buckets.set(row.day, {
            requestsUsed: toInt(row.requests_used),
            tokensUsed: toInt(row.tokens_used),
            successfulRequests: toInt(row.successful_requests),
            failedRequests: toInt(row.failed_requests),
        })
    }

    return fillDailySeries(periodStart, buckets, now)
}

export type UsageDailySegmentPoint = {
    date: string
    id: string
    name: string
    requestsUsed: number
    tokensUsed: number
}

type DailySegmentRawRow = {
    day: string
    segment_id: string
    segment_name: string
    requests_used: bigint | number
    tokens_used: bigint | number
}

/** Per-day × project usage for stacked charts (org scope, quota statuses). */
export async function aggregateDailyUsageByProject(
    organizationId: string,
    periodStart = startOfUtcMonth(),
    now = new Date(),
): Promise<UsageDailySegmentPoint[]> {
    const periodEnd = startOfNextUtcDay(now)
    const rows = await prismaClient.$queryRaw<DailySegmentRawRow[]>`
        SELECT
            to_char(
                date_trunc('day', r."createdAt" AT TIME ZONE 'UTC'),
                'YYYY-MM-DD'
            ) AS day,
            r."projectId" AS segment_id,
            p.name AS segment_name,
            COUNT(*)::bigint AS requests_used,
            COALESCE(SUM(r."totalTokens"), 0)::bigint AS tokens_used
        FROM "AIRequest" r
        INNER JOIN "Project" p ON p.id = r."projectId"
        WHERE p."organizationId" = ${organizationId}
          AND r."createdAt" >= ${periodStart}
          AND r."createdAt" < ${periodEnd}
          AND r."requestStatus" IN ('PENDING', 'SUCCESS', 'FAILED')
        GROUP BY 1, 2, 3
        ORDER BY 1 ASC
    `

    return rows.map((row) => ({
        date: row.day,
        id: row.segment_id,
        name: row.segment_name,
        requestsUsed: toInt(row.requests_used),
        tokensUsed: toInt(row.tokens_used),
    }))
}

type DailyModelRawRow = {
    day: string
    model_id: number
    requests_used: bigint | number
    tokens_used: bigint | number
}

/** Per-day × model usage for stacked charts (org scope, quota statuses). */
export async function aggregateDailyUsageByModel(
    organizationId: string,
    periodStart = startOfUtcMonth(),
    now = new Date(),
): Promise<UsageDailySegmentPoint[]> {
    const periodEnd = startOfNextUtcDay(now)
    const rows = await prismaClient.$queryRaw<DailyModelRawRow[]>`
        SELECT
            to_char(
                date_trunc('day', r."createdAt" AT TIME ZONE 'UTC'),
                'YYYY-MM-DD'
            ) AS day,
            r."modelId" AS model_id,
            COUNT(*)::bigint AS requests_used,
            COALESCE(SUM(r."totalTokens"), 0)::bigint AS tokens_used
        FROM "AIRequest" r
        INNER JOIN "Project" p ON p.id = r."projectId"
        WHERE p."organizationId" = ${organizationId}
          AND r."createdAt" >= ${periodStart}
          AND r."createdAt" < ${periodEnd}
          AND r."requestStatus" IN ('PENDING', 'SUCCESS', 'FAILED')
        GROUP BY 1, 2
        ORDER BY 1 ASC
    `

    if (rows.length === 0) return []

    const modelById = await resolveModelLabels(
        rows.map((row) => ({ modelId: row.model_id })),
    )

    return rows.map((row) => ({
        date: row.day,
        id: String(row.model_id),
        name: modelById.get(row.model_id) ?? `model:${row.model_id}`,
        requestsUsed: toInt(row.requests_used),
        tokensUsed: toInt(row.tokens_used),
    }))
}
