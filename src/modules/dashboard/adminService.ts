import { Prisma } from "../../generated/prisma/client.js"
import prismaClient from "../../platform/prisma.js"
import { estimateProviderCogsUsd, moneyString, usdToPhp } from "../finance/cogs.js"
import { parseFinancePeriod } from "../finance/period.js"
import adminFinanceService from "../finance/adminService.js"
import { fillDailySeries, startOfNextUtcDay } from "../usage/aggregate.js"
import adminUsageService from "../usage/adminService.js"
import type { AdminDashboardQuery } from "./adminSchemas.js"

type DailyRawRow = {
    day: string
    requests_used: bigint | number
    tokens_used: bigint | number
    successful_requests: bigint | number
    failed_requests: bigint | number
    total_cost: Prisma.Decimal | null
    avg_latency: number | null
    p95_latency: number | null
}

type TxMonthRaw = {
    period: string
    cash_php: Prisma.Decimal | null
}

function toInt(value: bigint | number | null | undefined): number {
    if (value == null) return 0
    return typeof value === "bigint" ? Number(value) : value
}

function shiftPeriod(period: string, deltaMonths: number): string {
    const { start } = parseFinancePeriod(period)
    const shifted = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + deltaMonths, 1))
    const y = shifted.getUTCFullYear()
    const m = String(shifted.getUTCMonth() + 1).padStart(2, "0")
    return `${y}-${m}`
}

function periodWindow(endPeriod: string, months: number): string[] {
    const list: string[] = []
    for (let i = months - 1; i >= 0; i -= 1) {
        list.push(shiftPeriod(endPeriod, -i))
    }
    return list
}

class AdminDashboardService {
    async getDashboard(query: AdminDashboardQuery) {
        const { period, months } = query
        const now = new Date()

        const [usage, financeOverview, marginByPlan, daily, monthlyFinance] = await Promise.all([
            adminUsageService.getPlatformUsage({ period }),
            adminFinanceService.getOverview({ period }),
            adminFinanceService.getMarginByPlan({ period }),
            this.loadDailySeries(period, now),
            this.loadMonthlyFinance(period, months, now),
        ])

        return {
            period,
            months,
            periodStart: usage.periodStart,
            periodEnd: usage.periodEnd,
            apiStatus: "ok" as const,
            usage: {
                totals: usage.totals,
                daily,
                byProvider: usage.byProvider,
                nearLimit: usage.nearLimit,
            },
            finance: {
                usdToPhpRate: financeOverview.usdToPhpRate,
                overview: {
                    cashCollectedPhp: financeOverview.cashCollectedPhp,
                    usageRetailUsd: financeOverview.usageRetailUsd,
                    usageRetailPhp: financeOverview.usageRetailPhp,
                    providerCogsUsd: financeOverview.providerCogsUsd,
                    providerCogsPhp: financeOverview.providerCogsPhp,
                    expensesPhp: financeOverview.expensesPhp,
                    grossMarginPhp: financeOverview.grossMarginPhp,
                    netProfitPhp: financeOverview.netProfitPhp,
                    requestCount: financeOverview.requestCount,
                },
                monthly: monthlyFinance,
                marginByPlan: marginByPlan.items,
            },
        }
    }

    private async loadDailySeries(period: string, now: Date) {
        const { start, end } = parseFinancePeriod(period)
        const clampedEnd = startOfNextUtcDay(now)
        const rangeEnd = end.getTime() > clampedEnd.getTime() ? clampedEnd : end

        const rows = await prismaClient.$queryRaw<DailyRawRow[]>`
            SELECT
                to_char(
                    date_trunc('day', r."createdAt" AT TIME ZONE 'UTC'),
                    'YYYY-MM-DD'
                ) AS day,
                COUNT(*) FILTER (
                    WHERE r."requestStatus" IN ('PENDING', 'SUCCESS', 'FAILED')
                )::bigint AS requests_used,
                COALESCE(
                    NULLIF(SUM(r."quotaTokens") FILTER (
                        WHERE r."requestStatus" IN ('PENDING', 'SUCCESS', 'FAILED')
                    ), 0),
                    SUM(r."totalTokens") FILTER (
                        WHERE r."requestStatus" IN ('PENDING', 'SUCCESS', 'FAILED')
                    ),
                    0
                )::bigint AS tokens_used,
                COUNT(*) FILTER (WHERE r."requestStatus" = 'SUCCESS')::bigint AS successful_requests,
                COUNT(*) FILTER (
                    WHERE r."requestStatus" IN ('FAILED', 'REJECTED')
                )::bigint AS failed_requests,
                SUM(r."requestCost") FILTER (
                    WHERE r."requestStatus" IN ('PENDING', 'SUCCESS', 'FAILED')
                ) AS total_cost,
                AVG(
                    CASE
                        WHEN r."requestStatus" = 'SUCCESS' AND r.latency IS NOT NULL
                        THEN r.latency
                    END
                )::float8 AS avg_latency,
                percentile_cont(0.95) WITHIN GROUP (
                    ORDER BY CASE
                        WHEN r."requestStatus" = 'SUCCESS' AND r.latency IS NOT NULL
                        THEN r.latency
                    END
                )::float8 AS p95_latency
            FROM "AIRequest" r
            WHERE r."createdAt" >= ${start}
              AND r."createdAt" < ${rangeEnd}
            GROUP BY 1
            ORDER BY 1 ASC
        `

        const buckets = new Map<
            string,
            {
                requestsUsed: number
                tokensUsed: number
                successfulRequests: number
                failedRequests: number
            }
        >()
        const extras = new Map<
            string,
            {
                totalCost: string
                avgLatency: number | null
                p95Latency: number | null
            }
        >()

        for (const row of rows) {
            buckets.set(row.day, {
                requestsUsed: toInt(row.requests_used),
                tokensUsed: toInt(row.tokens_used),
                successfulRequests: toInt(row.successful_requests),
                failedRequests: toInt(row.failed_requests),
            })
            extras.set(row.day, {
                totalCost: (row.total_cost ?? new Prisma.Decimal(0)).toString(),
                avgLatency: row.avg_latency == null ? null : Math.round(row.avg_latency),
                p95Latency: row.p95_latency == null ? null : Math.round(row.p95_latency),
            })
        }

        // Past months fill through month end; current month fills through today.
        const fillThrough =
            rangeEnd.getTime() >= clampedEnd.getTime()
                ? now
                : new Date(end.getTime() - 1)

        const base = fillDailySeries(start, buckets, fillThrough)
        return base.map((point) => {
            const extra = extras.get(point.date)
            return {
                date: point.date,
                requestsUsed: point.requestsUsed,
                tokensUsed: point.tokensUsed,
                successfulRequests: point.successfulRequests,
                failedRequests: point.failedRequests,
                totalCost: extra?.totalCost ?? "0",
                avgLatency: extra?.avgLatency ?? null,
                p95Latency: extra?.p95Latency ?? null,
            }
        })
    }

    private async loadMonthlyFinance(endPeriod: string, months: number, now: Date) {
        const periods = periodWindow(endPeriod, months)
        const first = parseFinancePeriod(periods[0]!)
        const last = parseFinancePeriod(periods[periods.length - 1]!)
        const clampedEnd = startOfNextUtcDay(now)
        const rangeEnd =
            last.end.getTime() > clampedEnd.getTime() ? clampedEnd : last.end

        const fxSettings = await prismaClient.platformBusinessSettings.findFirst()
        const fx = Number(fxSettings?.usdToPhpRate ?? 58)

        const [txRows, expenseGroups, usageRequests] = await Promise.all([
            prismaClient.$queryRaw<TxMonthRaw[]>`
                SELECT
                    to_char(
                        date_trunc('month', t."createdAt" AT TIME ZONE 'UTC'),
                        'YYYY-MM'
                    ) AS period,
                    COALESCE(SUM(t.amount), 0) AS cash_php
                FROM "Transaction" t
                WHERE t."paymentStatus" = 'SUCCEEDED'
                  AND t."createdAt" >= ${first.start}
                  AND t."createdAt" < ${rangeEnd}
                GROUP BY 1
            `,
            prismaClient.expense.groupBy({
                by: ["period"],
                where: { period: { in: periods } },
                _sum: { amountPhp: true },
            }),
            prismaClient.aIRequest.findMany({
                where: {
                    createdAt: { gte: first.start, lt: rangeEnd },
                    requestStatus: "SUCCESS",
                },
                select: {
                    createdAt: true,
                    inputTokens: true,
                    outputTokens: true,
                    requestCost: true,
                    model: {
                        select: {
                            providerInputPrice: true,
                            providerOutputPrice: true,
                        },
                    },
                },
            }),
        ])

        const cashByPeriod = new Map<string, number>()
        for (const row of txRows) {
            cashByPeriod.set(row.period, Number(row.cash_php ?? 0))
        }

        const expensesByPeriod = new Map<string, number>()
        for (const row of expenseGroups) {
            expensesByPeriod.set(row.period, Number(row._sum.amountPhp ?? 0))
        }

        const cogsByPeriod = new Map<
            string,
            { providerCogsUsd: number; usageRetailUsd: number; requestCount: number }
        >()
        for (const r of usageRequests) {
            const key = `${r.createdAt.getUTCFullYear()}-${String(r.createdAt.getUTCMonth() + 1).padStart(2, "0")}`
            let bucket = cogsByPeriod.get(key)
            if (!bucket) {
                bucket = { providerCogsUsd: 0, usageRetailUsd: 0, requestCount: 0 }
                cogsByPeriod.set(key, bucket)
            }
            bucket.providerCogsUsd += estimateProviderCogsUsd({
                inputTokens: r.inputTokens,
                outputTokens: r.outputTokens,
                providerInputPrice: r.model.providerInputPrice.toString(),
                providerOutputPrice: r.model.providerOutputPrice.toString(),
            })
            bucket.usageRetailUsd += Number(r.requestCost ?? 0)
            bucket.requestCount += 1
        }

        return periods.map((p) => {
            const cashCollectedPhp = cashByPeriod.get(p) ?? 0
            const expensesPhp = expensesByPeriod.get(p) ?? 0
            const cogs = cogsByPeriod.get(p) ?? {
                providerCogsUsd: 0,
                usageRetailUsd: 0,
                requestCount: 0,
            }
            const providerCogsPhp = usdToPhp(cogs.providerCogsUsd, fx)
            const grossMarginPhp = cashCollectedPhp - providerCogsPhp
            const netProfitPhp = grossMarginPhp - expensesPhp
            return {
                period: p,
                cashCollectedPhp: moneyString(cashCollectedPhp),
                providerCogsUsd: moneyString(cogs.providerCogsUsd, 6),
                providerCogsPhp: moneyString(providerCogsPhp),
                expensesPhp: moneyString(expensesPhp),
                grossMarginPhp: moneyString(grossMarginPhp),
                netProfitPhp: moneyString(netProfitPhp),
                usageRetailUsd: moneyString(cogs.usageRetailUsd, 6),
                usageRetailPhp: moneyString(usdToPhp(cogs.usageRetailUsd, fx)),
                requestCount: cogs.requestCount,
            }
        })
    }
}

export default new AdminDashboardService()
