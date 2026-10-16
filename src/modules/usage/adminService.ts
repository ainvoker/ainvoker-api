import { Prisma, type Prisma as PrismaTypes } from "../../generated/prisma/client.js"
import { AppError } from "../../platform/errors.js"
import prismaClient from "../../platform/prisma.js"
import { PLAN_NAMES } from "../billing/catalog.js"
import { isEntitlementUnexpired } from "../billing/period.js"
import { parseFinancePeriod } from "../finance/period.js"
import {
    QUOTA_STATUSES,
    quotaTokensFromSum,
    startOfNextUtcDay,
} from "./aggregate.js"
import type {
    AdminUsagePeriodQuery,
    ListAdminAiRequestsQuery,
} from "./adminSchemas.js"

const NEAR_LIMIT_THRESHOLD = 0.8

type LatencyRawRow = {
    avg: number | null
    p50: number | null
    p95: number | null
}

type OrgBreakdownRaw = {
    organization_id: string
    organization_name: string
    organization_slug: string
    requests_used: bigint | number
    tokens_used: bigint | number
    total_cost: Prisma.Decimal | null
}

type ModelBreakdownRaw = {
    model_id: number
    model_name: string
    provider_name: string
    requests_used: bigint | number
    tokens_used: bigint | number
    total_cost: Prisma.Decimal | null
}

type ProviderBreakdownRaw = {
    provider_id: number
    provider_name: string
    requests_used: bigint | number
    tokens_used: bigint | number
    total_cost: Prisma.Decimal | null
}

function toInt(value: bigint | number | null | undefined): number {
    if (value == null) return 0
    return typeof value === "bigint" ? Number(value) : value
}

function moneyString(value: Prisma.Decimal | null | undefined): string {
    return (value ?? new Prisma.Decimal(0)).toString()
}

function pct(used: number, limit: number): number | null {
    if (limit <= 0) return null
    return Math.round((used / limit) * 1000) / 10
}

function periodBounds(period: string, now = new Date()): { start: Date; end: Date } {
    const parsed = parseFinancePeriod(period)
    const clampedEnd = startOfNextUtcDay(now)
    const end = parsed.end.getTime() > clampedEnd.getTime() ? clampedEnd : parsed.end
    return { start: parsed.start, end }
}

class AdminUsageService {
    private readonly include = {
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
        project: {
            select: {
                id: true,
                name: true,
                organizationId: true,
                organization: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
            },
        },
    } as const

    private serializeSummary(
        row: {
            id: string
            projectId: string
            apiKeyId: string
            serviceType: string
            requestStatus: string
            inputTokens: number | null
            outputTokens: number | null
            totalTokens: number | null
            latency: number | null
            requestCost: Prisma.Decimal | null
            createdAt: Date
            model: { name: string; provider: { name: string } }
            apiKey: { keyName: string; keyPrefix: string }
            project: {
                id: string
                name: string
                organizationId: string
                organization: { id: string; name: string; slug: string }
            }
        },
    ) {
        return {
            id: row.id,
            projectId: row.projectId,
            projectName: row.project.name,
            organizationId: row.project.organizationId,
            organizationName: row.project.organization.name,
            organizationSlug: row.project.organization.slug,
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
    }

    async getPlatformUsage(query: AdminUsagePeriodQuery) {
        const { period } = query
        const { start, end } = periodBounds(period)
        const createdAt = { gte: start, lt: end }

        const [quotaAgg, successfulRequests, failedRequests, latencyRows, byOrgRaw, byModelRaw, byProviderRaw] =
            await Promise.all([
                prismaClient.aIRequest.aggregate({
                    where: {
                        createdAt,
                        requestStatus: { in: [...QUOTA_STATUSES] },
                    },
                    _count: { _all: true },
                    _sum: {
                        totalTokens: true,
                        quotaTokens: true,
                        requestCost: true,
                    },
                }),
                prismaClient.aIRequest.count({
                    where: { createdAt, requestStatus: "SUCCESS" },
                }),
                prismaClient.aIRequest.count({
                    where: {
                        createdAt,
                        requestStatus: { in: ["FAILED", "REJECTED"] },
                    },
                }),
                prismaClient.$queryRaw<LatencyRawRow[]>`
                    SELECT
                        AVG(r.latency)::float8 AS avg,
                        percentile_cont(0.5) WITHIN GROUP (ORDER BY r.latency)::float8 AS p50,
                        percentile_cont(0.95) WITHIN GROUP (ORDER BY r.latency)::float8 AS p95
                    FROM "AIRequest" r
                    WHERE r."requestStatus" = 'SUCCESS'
                      AND r.latency IS NOT NULL
                      AND r."createdAt" >= ${start}
                      AND r."createdAt" < ${end}
                `,
                prismaClient.$queryRaw<OrgBreakdownRaw[]>`
                    SELECT
                        o.id AS organization_id,
                        o.name AS organization_name,
                        o.slug AS organization_slug,
                        COUNT(*)::bigint AS requests_used,
                        COALESCE(NULLIF(SUM(r."quotaTokens"), 0), SUM(r."totalTokens"), 0)::bigint AS tokens_used,
                        SUM(r."requestCost") AS total_cost
                    FROM "AIRequest" r
                    INNER JOIN "Project" p ON p.id = r."projectId"
                    INNER JOIN "Organization" o ON o.id = p."organizationId"
                    WHERE r."createdAt" >= ${start}
                      AND r."createdAt" < ${end}
                      AND r."requestStatus" IN ('PENDING', 'SUCCESS', 'FAILED')
                    GROUP BY o.id, o.name, o.slug
                    ORDER BY requests_used DESC
                `,
                prismaClient.$queryRaw<ModelBreakdownRaw[]>`
                    SELECT
                        m.id AS model_id,
                        m.name AS model_name,
                        pr.name AS provider_name,
                        COUNT(*)::bigint AS requests_used,
                        COALESCE(NULLIF(SUM(r."quotaTokens"), 0), SUM(r."totalTokens"), 0)::bigint AS tokens_used,
                        SUM(r."requestCost") AS total_cost
                    FROM "AIRequest" r
                    INNER JOIN "AIModel" m ON m.id = r."modelId"
                    INNER JOIN "AIProvider" pr ON pr.id = m."providerId"
                    WHERE r."createdAt" >= ${start}
                      AND r."createdAt" < ${end}
                      AND r."requestStatus" IN ('PENDING', 'SUCCESS', 'FAILED')
                    GROUP BY m.id, m.name, pr.name
                    ORDER BY requests_used DESC
                `,
                prismaClient.$queryRaw<ProviderBreakdownRaw[]>`
                    SELECT
                        pr.id AS provider_id,
                        pr.name AS provider_name,
                        COUNT(*)::bigint AS requests_used,
                        COALESCE(NULLIF(SUM(r."quotaTokens"), 0), SUM(r."totalTokens"), 0)::bigint AS tokens_used,
                        SUM(r."requestCost") AS total_cost
                    FROM "AIRequest" r
                    INNER JOIN "AIModel" m ON m.id = r."modelId"
                    INNER JOIN "AIProvider" pr ON pr.id = m."providerId"
                    WHERE r."createdAt" >= ${start}
                      AND r."createdAt" < ${end}
                      AND r."requestStatus" IN ('PENDING', 'SUCCESS', 'FAILED')
                    GROUP BY pr.id, pr.name
                    ORDER BY requests_used DESC
                `,
            ])

        const requests = quotaAgg._count._all
        const tokensUsed = quotaTokensFromSum(quotaAgg._sum)
        const totalCost = moneyString(quotaAgg._sum.requestCost)
        const decided = successfulRequests + failedRequests
        const errorRate =
            decided === 0 ? 0 : Math.round((failedRequests / decided) * 1000) / 10

        const latencyRow = latencyRows[0]
        const round = (value: number | null | undefined) =>
            value == null ? null : Math.round(value)

        const nearLimit = await this.listNearLimitOrgs(start, end)

        return {
            period,
            periodStart: start.toISOString(),
            periodEnd: end.toISOString(),
            totals: {
                requests,
                successfulRequests,
                failedRequests,
                tokensUsed,
                totalCost,
                errorRate,
                avgLatency: round(latencyRow?.avg),
                p50Latency: round(latencyRow?.p50),
                p95Latency: round(latencyRow?.p95),
            },
            byOrganization: byOrgRaw.map((row) => ({
                organizationId: row.organization_id,
                organizationName: row.organization_name,
                organizationSlug: row.organization_slug,
                requestsUsed: toInt(row.requests_used),
                tokensUsed: toInt(row.tokens_used),
                totalCost: moneyString(row.total_cost),
            })),
            byModel: byModelRaw.map((row) => ({
                modelId: row.model_id,
                model: `${row.provider_name}/${row.model_name}`,
                providerName: row.provider_name,
                requestsUsed: toInt(row.requests_used),
                tokensUsed: toInt(row.tokens_used),
                totalCost: moneyString(row.total_cost),
            })),
            byProvider: byProviderRaw.map((row) => ({
                providerId: row.provider_id,
                providerName: row.provider_name,
                requestsUsed: toInt(row.requests_used),
                tokensUsed: toInt(row.tokens_used),
                totalCost: moneyString(row.total_cost),
            })),
            nearLimit,
        }
    }

    private async listNearLimitOrgs(start: Date, end: Date) {
        const subscriptions = await prismaClient.subscription.findMany({
            where: {
                status: { in: ["ACTIVE", "PAST_DUE"] },
            },
            include: {
                plan: true,
                organization: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        createdByUserId: true,
                        createdBy: {
                            select: {
                                freeQuotaUnitsUsed: true,
                                freeQuotaUnitsLimit: true,
                            },
                        },
                    },
                },
            },
            orderBy: { startedAt: "desc" },
        })

        const seen = new Set<string>()
        const entitled = subscriptions.filter((sub) => {
            if (seen.has(sub.organizationId)) return false
            if (!isEntitlementUnexpired(sub.expiresAt)) return false
            seen.add(sub.organizationId)
            return true
        })

        if (entitled.length === 0) return []

        const orgIds = entitled.map((s) => s.organizationId)
        const [usageRows, pendingRows, projects] = await Promise.all([
            prismaClient.aIRequest.groupBy({
                by: ["projectId"],
                where: {
                    project: { organizationId: { in: orgIds } },
                    createdAt: { gte: start, lt: end },
                    requestStatus: { in: [...QUOTA_STATUSES] },
                },
                _count: { _all: true },
                _sum: { totalTokens: true, quotaTokens: true },
            }),
            prismaClient.aIRequest.groupBy({
                by: ["projectId"],
                where: {
                    project: { organizationId: { in: orgIds } },
                    requestStatus: "PENDING",
                },
                _sum: { quotaTokens: true, totalTokens: true },
            }),
            prismaClient.project.findMany({
                where: { organizationId: { in: orgIds } },
                select: { id: true, organizationId: true },
            }),
        ])

        const projectOrg = new Map(projects.map((p) => [p.id, p.organizationId]))

        const usageByOrg = new Map<string, { requestsUsed: number; tokensUsed: number }>()
        for (const row of usageRows) {
            const orgId = projectOrg.get(row.projectId)
            if (!orgId) continue
            const prev = usageByOrg.get(orgId) ?? { requestsUsed: 0, tokensUsed: 0 }
            prev.requestsUsed += row._count._all
            prev.tokensUsed += quotaTokensFromSum(row._sum)
            usageByOrg.set(orgId, prev)
        }

        const pendingByOrg = new Map<string, number>()
        for (const row of pendingRows) {
            const orgId = projectOrg.get(row.projectId)
            if (!orgId) continue
            pendingByOrg.set(
                orgId,
                (pendingByOrg.get(orgId) ?? 0) + quotaTokensFromSum(row._sum),
            )
        }

        const nearLimit: Array<{
            organizationId: string
            organizationName: string
            organizationSlug: string
            planName: string
            requestsUsed: number
            requestLimit: number
            requestsPct: number | null
            tokensUsed: number
            tokenLimit: number
            tokensPct: number | null
        }> = []

        for (const sub of entitled) {
            const org = sub.organization
            const plan = sub.plan
            const usage = usageByOrg.get(org.id) ?? { requestsUsed: 0, tokensUsed: 0 }

            let tokensUsed = usage.tokensUsed
            let tokenLimit = plan.tokenLimit
            if (plan.name === PLAN_NAMES.free && org.createdBy) {
                tokensUsed =
                    org.createdBy.freeQuotaUnitsUsed + (pendingByOrg.get(org.id) ?? 0)
                tokenLimit = org.createdBy.freeQuotaUnitsLimit
            }

            const enforceRequests =
                plan.name === PLAN_NAMES.free ||
                plan.billingMode === "FIXED_MONTHLY" ||
                plan.requestLimit > 0
            const enforceTokens =
                plan.name === PLAN_NAMES.free ||
                plan.billingMode === "FIXED_MONTHLY" ||
                plan.tokenLimit > 0

            const requestsPct =
                enforceRequests && plan.requestLimit > 0
                    ? pct(usage.requestsUsed, plan.requestLimit)
                    : null
            const tokensPct =
                enforceTokens && tokenLimit > 0 ? pct(tokensUsed, tokenLimit) : null

            const nearRequests = requestsPct != null && requestsPct >= NEAR_LIMIT_THRESHOLD * 100
            const nearTokens = tokensPct != null && tokensPct >= NEAR_LIMIT_THRESHOLD * 100
            if (!nearRequests && !nearTokens) continue

            nearLimit.push({
                organizationId: org.id,
                organizationName: org.name,
                organizationSlug: org.slug,
                planName: plan.name,
                requestsUsed: usage.requestsUsed,
                requestLimit: plan.requestLimit,
                requestsPct,
                tokensUsed,
                tokenLimit,
                tokensPct,
            })
        }

        nearLimit.sort((a, b) => {
            const aMax = Math.max(a.requestsPct ?? 0, a.tokensPct ?? 0)
            const bMax = Math.max(b.requestsPct ?? 0, b.tokensPct ?? 0)
            return bMax - aMax
        })

        return nearLimit
    }

    private listWhere(query: ListAdminAiRequestsQuery): PrismaTypes.AIRequestWhereInput {
        const clauses: PrismaTypes.AIRequestWhereInput[] = []

        if (query.status) {
            clauses.push({ requestStatus: query.status })
        }
        if (query.organizationId) {
            clauses.push({ project: { organizationId: query.organizationId } })
        }
        if (query.period) {
            const { start, end } = periodBounds(query.period)
            clauses.push({ createdAt: { gte: start, lt: end } })
        }

        const q = query.q?.trim()
        if (q) {
            clauses.push({
                OR: [
                    { id: { contains: q, mode: "insensitive" } },
                    { project: { name: { contains: q, mode: "insensitive" } } },
                    {
                        project: {
                            organization: {
                                name: { contains: q, mode: "insensitive" },
                            },
                        },
                    },
                    {
                        project: {
                            organization: {
                                slug: { contains: q, mode: "insensitive" },
                            },
                        },
                    },
                    {
                        model: {
                            name: { contains: q, mode: "insensitive" },
                        },
                    },
                    {
                        model: {
                            provider: {
                                name: { contains: q, mode: "insensitive" },
                            },
                        },
                    },
                ],
            })
        }

        if (clauses.length === 0) return {}
        if (clauses.length === 1) return clauses[0]!
        return { AND: clauses }
    }

    async listAiRequests(query: ListAdminAiRequestsQuery) {
        const where = this.listWhere(query)

        const [rows, total] = await Promise.all([
            prismaClient.aIRequest.findMany({
                where,
                include: this.include,
                orderBy: { createdAt: "desc" },
                take: query.limit,
                skip: query.offset,
            }),
            prismaClient.aIRequest.count({ where }),
        ])

        return {
            items: rows.map((row) => this.serializeSummary(row)),
            total,
            limit: query.limit,
            offset: query.offset,
        }
    }

    async getAiRequest(requestId: string) {
        const row = await prismaClient.aIRequest.findUnique({
            where: { id: requestId },
            include: this.include,
        })

        if (!row) {
            throw new AppError(404, "NOT_FOUND", "AI request not found")
        }

        return {
            ...this.serializeSummary(row),
            requestPayload: row.requestPayload,
            responsePayload: row.responsePayload,
        }
    }
}

export default new AdminUsageService()
