import type { Prisma } from "../../generated/prisma/client.js"
import { AppError } from "../../platform/errors.js"
import prismaClient from "../../platform/prisma.js"
import { estimateProviderCogsUsd, moneyString, roundMoney, usdToPhp } from "./cogs.js"
import {
    matchProviderRows,
    matchXenditRows,
    parseProviderCsv,
    parseXenditCsv,
} from "./csv.js"
import { parseFinancePeriod } from "./period.js"
import type {
    CreateFinanceExpenseInput,
    FinancePeriodQuery,
    FinanceReconciliationUpload,
    ListFinanceExpensesQuery,
    UpdateFinanceExpenseInput,
} from "./adminSchemas.js"

type PlanBucket = {
    planName: string
    cashCollectedPhp: number
    providerCogsUsd: number
    providerCogsPhp: number
    usageRetailUsd: number
    usageRetailPhp: number
    requestCount: number
}

async function getUsdToPhpRate(): Promise<number> {
    const settings = await prismaClient.platformBusinessSettings.findFirst()
    return Number(settings?.usdToPhpRate ?? 58)
}

function emptyPlanBucket(planName: string): PlanBucket {
    return {
        planName,
        cashCollectedPhp: 0,
        providerCogsUsd: 0,
        providerCogsPhp: 0,
        usageRetailUsd: 0,
        usageRetailPhp: 0,
        requestCount: 0,
    }
}

function serializeExpense(row: {
    id: string
    category: string
    amountPhp: Prisma.Decimal | { toString(): string }
    period: string
    description: string
    notes: string | null
    createdAt: Date
    updatedAt: Date
}) {
    return {
        id: row.id,
        category: row.category,
        amountPhp: Number(row.amountPhp).toFixed(2),
        period: row.period,
        description: row.description,
        notes: row.notes,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
    }
}

/** Pick plan covering request time; fall back to unknown. */
function planForOrgAt(
    orgId: string,
    at: Date,
    subsByOrg: Map<
        string,
        Array<{ planName: string; startedAt: Date; expiresAt: Date | null; status: string }>
    >,
): string {
    const subs = subsByOrg.get(orgId) ?? []
    const covering = subs.filter((s) => {
        if (s.startedAt > at) return false
        if (s.expiresAt && s.expiresAt <= at) return false
        return s.status === "ACTIVE" || s.status === "PAST_DUE" || s.status === "CANCELED"
    })
    if (covering.length === 0) return "unknown"
    covering.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
    return covering[0]!.planName
}

class AdminFinanceService {
    async getOverview(query: FinancePeriodQuery) {
        const { period, start, end } = parseFinancePeriod(query.period)
        const fx = await getUsdToPhpRate()

        const [txAgg, expensesAgg, usage] = await Promise.all([
            prismaClient.transaction.aggregate({
                where: {
                    paymentStatus: "SUCCEEDED",
                    createdAt: { gte: start, lt: end },
                },
                _sum: { amount: true },
            }),
            prismaClient.expense.aggregate({
                where: { period },
                _sum: { amountPhp: true },
            }),
            this.loadUsageTotals(start, end, fx),
        ])

        const cashCollectedPhp = Number(txAgg._sum.amount ?? 0)
        const expensesPhp = Number(expensesAgg._sum.amountPhp ?? 0)
        const providerCogsPhp = usage.providerCogsPhp
        const usageRetailPhp = usage.usageRetailPhp
        const grossMarginPhp = cashCollectedPhp - providerCogsPhp
        const netProfitPhp = grossMarginPhp - expensesPhp

        return {
            period,
            periodStart: start.toISOString(),
            periodEnd: end.toISOString(),
            usdToPhpRate: moneyString(fx, 4),
            cashCollectedPhp: moneyString(cashCollectedPhp),
            usageRetailUsd: moneyString(usage.usageRetailUsd, 6),
            usageRetailPhp: moneyString(usageRetailPhp),
            providerCogsUsd: moneyString(usage.providerCogsUsd, 6),
            providerCogsPhp: moneyString(providerCogsPhp),
            expensesPhp: moneyString(expensesPhp),
            grossMarginPhp: moneyString(grossMarginPhp),
            netProfitPhp: moneyString(netProfitPhp),
            requestCount: usage.requestCount,
        }
    }

    async getMarginByPlan(query: FinancePeriodQuery) {
        const { period, start, end } = parseFinancePeriod(query.period)
        const fx = await getUsdToPhpRate()

        const [transactions, usageByPlan] = await Promise.all([
            prismaClient.transaction.findMany({
                where: {
                    paymentStatus: "SUCCEEDED",
                    createdAt: { gte: start, lt: end },
                },
                select: {
                    amount: true,
                    subscription: { select: { plan: { select: { name: true } } } },
                },
            }),
            this.loadUsageByPlan(start, end, fx),
        ])

        const buckets = new Map<string, PlanBucket>()
        const ensure = (name: string) => {
            let b = buckets.get(name)
            if (!b) {
                b = emptyPlanBucket(name)
                buckets.set(name, b)
            }
            return b
        }

        for (const tx of transactions) {
            const b = ensure(tx.subscription.plan.name)
            b.cashCollectedPhp += Number(tx.amount)
        }
        for (const [planName, u] of usageByPlan) {
            const b = ensure(planName)
            b.providerCogsUsd += u.providerCogsUsd
            b.providerCogsPhp += u.providerCogsPhp
            b.usageRetailUsd += u.usageRetailUsd
            b.usageRetailPhp += u.usageRetailPhp
            b.requestCount += u.requestCount
        }

        const items = [...buckets.values()]
            .sort((a, b) => a.planName.localeCompare(b.planName))
            .map((b) => {
                const grossMarginPhp = b.cashCollectedPhp - b.providerCogsPhp
                return {
                    planName: b.planName,
                    cashCollectedPhp: moneyString(b.cashCollectedPhp),
                    usageRetailUsd: moneyString(b.usageRetailUsd, 6),
                    usageRetailPhp: moneyString(b.usageRetailPhp),
                    providerCogsUsd: moneyString(b.providerCogsUsd, 6),
                    providerCogsPhp: moneyString(b.providerCogsPhp),
                    grossMarginPhp: moneyString(grossMarginPhp),
                    requestCount: b.requestCount,
                }
            })

        return { period, usdToPhpRate: moneyString(fx, 4), items }
    }

    private async loadUsageTotals(start: Date, end: Date, fx: number) {
        const requests = await prismaClient.aIRequest.findMany({
            where: {
                createdAt: { gte: start, lt: end },
                requestStatus: "SUCCESS",
            },
            select: {
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
        })

        let providerCogsUsd = 0
        let usageRetailUsd = 0
        for (const r of requests) {
            providerCogsUsd += estimateProviderCogsUsd({
                inputTokens: r.inputTokens,
                outputTokens: r.outputTokens,
                providerInputPrice: r.model.providerInputPrice.toString(),
                providerOutputPrice: r.model.providerOutputPrice.toString(),
            })
            usageRetailUsd += Number(r.requestCost ?? 0)
        }

        return {
            providerCogsUsd,
            providerCogsPhp: usdToPhp(providerCogsUsd, fx),
            usageRetailUsd,
            usageRetailPhp: usdToPhp(usageRetailUsd, fx),
            requestCount: requests.length,
        }
    }

    private async loadUsageByPlan(start: Date, end: Date, fx: number) {
        const requests = await prismaClient.aIRequest.findMany({
            where: {
                createdAt: { gte: start, lt: end },
                requestStatus: "SUCCESS",
            },
            select: {
                createdAt: true,
                inputTokens: true,
                outputTokens: true,
                requestCost: true,
                project: { select: { organizationId: true } },
                model: {
                    select: {
                        providerInputPrice: true,
                        providerOutputPrice: true,
                    },
                },
            },
        })

        const orgIds = [...new Set(requests.map((r) => r.project.organizationId))]
        const subscriptions =
            orgIds.length === 0
                ? []
                : await prismaClient.subscription.findMany({
                      where: { organizationId: { in: orgIds } },
                      select: {
                          organizationId: true,
                          status: true,
                          startedAt: true,
                          expiresAt: true,
                          plan: { select: { name: true } },
                      },
                  })

        const subsByOrg = new Map<
            string,
            Array<{ planName: string; startedAt: Date; expiresAt: Date | null; status: string }>
        >()
        for (const s of subscriptions) {
            const list = subsByOrg.get(s.organizationId) ?? []
            list.push({
                planName: s.plan.name,
                startedAt: s.startedAt,
                expiresAt: s.expiresAt,
                status: s.status,
            })
            subsByOrg.set(s.organizationId, list)
        }

        const byPlan = new Map<
            string,
            {
                providerCogsUsd: number
                providerCogsPhp: number
                usageRetailUsd: number
                usageRetailPhp: number
                requestCount: number
            }
        >()

        for (const r of requests) {
            const planName = planForOrgAt(r.project.organizationId, r.createdAt, subsByOrg)
            let bucket = byPlan.get(planName)
            if (!bucket) {
                bucket = {
                    providerCogsUsd: 0,
                    providerCogsPhp: 0,
                    usageRetailUsd: 0,
                    usageRetailPhp: 0,
                    requestCount: 0,
                }
                byPlan.set(planName, bucket)
            }
            const cogsUsd = estimateProviderCogsUsd({
                inputTokens: r.inputTokens,
                outputTokens: r.outputTokens,
                providerInputPrice: r.model.providerInputPrice.toString(),
                providerOutputPrice: r.model.providerOutputPrice.toString(),
            })
            const retailUsd = Number(r.requestCost ?? 0)
            bucket.providerCogsUsd += cogsUsd
            bucket.providerCogsPhp += usdToPhp(cogsUsd, fx)
            bucket.usageRetailUsd += retailUsd
            bucket.usageRetailPhp += usdToPhp(retailUsd, fx)
            bucket.requestCount += 1
        }

        return byPlan
    }

    async listExpenses(query: ListFinanceExpensesQuery) {
        const where: Prisma.ExpenseWhereInput = {}
        if (query.period) {
            parseFinancePeriod(query.period)
            where.period = query.period
        }
        const items = await prismaClient.expense.findMany({
            where,
            orderBy: [{ period: "desc" }, { createdAt: "desc" }],
        })
        return { items: items.map(serializeExpense) }
    }

    async createExpense(input: CreateFinanceExpenseInput) {
        parseFinancePeriod(input.period)
        const row = await prismaClient.expense.create({
            data: {
                category: input.category,
                amountPhp: input.amountPhp,
                period: input.period,
                description: input.description,
                notes: input.notes ?? null,
            },
        })
        return serializeExpense(row)
    }

    async updateExpense(expenseId: string, input: UpdateFinanceExpenseInput) {
        const existing = await prismaClient.expense.findUnique({ where: { id: expenseId } })
        if (!existing) {
            throw new AppError(404, "NOT_FOUND", "Expense not found")
        }
        if (input.period) parseFinancePeriod(input.period)

        const row = await prismaClient.expense.update({
            where: { id: expenseId },
            data: {
                ...(input.category !== undefined ? { category: input.category } : {}),
                ...(input.amountPhp !== undefined ? { amountPhp: input.amountPhp } : {}),
                ...(input.period !== undefined ? { period: input.period } : {}),
                ...(input.description !== undefined ? { description: input.description } : {}),
                ...(input.notes !== undefined ? { notes: input.notes } : {}),
            },
        })
        return serializeExpense(row)
    }

    async getXenditReconciliation(query: FinancePeriodQuery) {
        const { period, start, end } = parseFinancePeriod(query.period)
        const [internal, latestRun] = await Promise.all([
            this.loadSucceededTransactions(start, end),
            this.latestRun("XENDIT", period),
        ])
        return {
            period,
            internal: {
                transactionCount: internal.length,
                totalPhp: moneyString(internal.reduce((s, t) => s + t.amountPhp, 0)),
            },
            latestRun,
        }
    }

    async getProviderReconciliation(query: FinancePeriodQuery) {
        const { period, start, end } = parseFinancePeriod(query.period)
        const fx = await getUsdToPhpRate()
        const [byProvider, latestRun] = await Promise.all([
            this.loadProviderCogs(start, end),
            this.latestRun("PROVIDER", period),
        ])
        const totalUsd = byProvider.reduce((s, p) => s + p.amountUsd, 0)
        return {
            period,
            usdToPhpRate: moneyString(fx, 4),
            internal: {
                providers: byProvider.map((p) => ({
                    provider: p.provider,
                    amountUsd: moneyString(p.amountUsd, 6),
                    amountPhp: moneyString(usdToPhp(p.amountUsd, fx)),
                })),
                totalUsd: moneyString(totalUsd, 6),
                totalPhp: moneyString(usdToPhp(totalUsd, fx)),
            },
            latestRun,
        }
    }

    async uploadXenditReconciliation(input: FinanceReconciliationUpload) {
        const { period, start, end } = parseFinancePeriod(input.period)
        let csvRows
        try {
            csvRows = parseXenditCsv(input.csvText)
        } catch (err) {
            throw new AppError(
                400,
                "VALIDATION_ERROR",
                err instanceof Error ? err.message : "Invalid Xendit CSV",
            )
        }

        const dbRows = await this.loadSucceededTransactions(start, end)
        const result = matchXenditRows(csvRows, dbRows)
        const driftItems = result.items.filter((i) => i.status !== "matched").slice(0, 100)
        const summaryJson = {
            csvTotalPhp: roundMoney(csvRows.reduce((s, r) => s + r.amountPhp, 0)),
            dbTotalPhp: roundMoney(dbRows.reduce((s, r) => s + r.amountPhp, 0)),
            items: result.items.map((i) => ({
                ...i,
                csvAmountPhp: i.csvAmountPhp === null ? null : moneyString(i.csvAmountPhp),
                dbAmountPhp: i.dbAmountPhp === null ? null : moneyString(i.dbAmountPhp),
            })),
            driftSample: driftItems.map((i) => ({
                ...i,
                csvAmountPhp: i.csvAmountPhp === null ? null : moneyString(i.csvAmountPhp),
                dbAmountPhp: i.dbAmountPhp === null ? null : moneyString(i.dbAmountPhp),
            })),
        }

        const run = await prismaClient.financeReconciliationRun.create({
            data: {
                kind: "XENDIT",
                period,
                filename: input.filename ?? null,
                rowCount: csvRows.length,
                matchedCount: result.matchedCount,
                driftCount: result.driftCount,
                summaryJson,
            },
        })

        return this.serializeRun(run)
    }

    async uploadProviderReconciliation(input: FinanceReconciliationUpload) {
        const { period, start, end } = parseFinancePeriod(input.period)
        const fx = await getUsdToPhpRate()
        let csvRows
        try {
            csvRows = parseProviderCsv(input.csvText, { start, end })
        } catch (err) {
            throw new AppError(
                400,
                "VALIDATION_ERROR",
                err instanceof Error ? err.message : "Invalid provider CSV",
            )
        }

        const csvUsd = csvRows.map((r) => ({
            provider: r.provider,
            amountUsd: r.currency === "php" ? (fx > 0 ? r.amount / fx : 0) : r.amount,
        }))
        const dbRows = await this.loadProviderCogs(start, end)
        const result = matchProviderRows(csvUsd, dbRows)
        const driftItems = result.items.filter((i) => i.status !== "matched").slice(0, 100)
        const summaryJson = {
            usdToPhpRate: moneyString(fx, 4),
            csvTotalUsd: roundMoney(
                csvUsd.reduce((s, r) => s + r.amountUsd, 0),
                6,
            ),
            dbTotalUsd: roundMoney(
                dbRows.reduce((s, r) => s + r.amountUsd, 0),
                6,
            ),
            items: result.items.map((i) => ({
                ...i,
                csvAmountUsd: i.csvAmountUsd === null ? null : moneyString(i.csvAmountUsd, 6),
                dbAmountUsd: i.dbAmountUsd === null ? null : moneyString(i.dbAmountUsd, 6),
                csvAmountPhp:
                    i.csvAmountUsd === null ? null : moneyString(usdToPhp(i.csvAmountUsd, fx)),
                dbAmountPhp:
                    i.dbAmountUsd === null ? null : moneyString(usdToPhp(i.dbAmountUsd, fx)),
            })),
            driftSample: driftItems.map((i) => ({
                ...i,
                csvAmountUsd: i.csvAmountUsd === null ? null : moneyString(i.csvAmountUsd, 6),
                dbAmountUsd: i.dbAmountUsd === null ? null : moneyString(i.dbAmountUsd, 6),
            })),
        }

        const run = await prismaClient.financeReconciliationRun.create({
            data: {
                kind: "PROVIDER",
                period,
                filename: input.filename ?? null,
                rowCount: csvRows.length,
                matchedCount: result.matchedCount,
                driftCount: result.driftCount,
                summaryJson,
            },
        })

        return this.serializeRun(run)
    }

    private async loadSucceededTransactions(start: Date, end: Date) {
        const rows = await prismaClient.transaction.findMany({
            where: {
                paymentStatus: "SUCCEEDED",
                createdAt: { gte: start, lt: end },
            },
            select: { referenceNumber: true, amount: true },
        })
        return rows.map((r) => ({
            referenceNumber: r.referenceNumber,
            amountPhp: Number(r.amount),
        }))
    }

    private async loadProviderCogs(start: Date, end: Date) {
        const requests = await prismaClient.aIRequest.findMany({
            where: {
                createdAt: { gte: start, lt: end },
                requestStatus: "SUCCESS",
            },
            select: {
                inputTokens: true,
                outputTokens: true,
                model: {
                    select: {
                        providerInputPrice: true,
                        providerOutputPrice: true,
                        provider: { select: { name: true } },
                    },
                },
            },
        })

        const byProvider = new Map<string, number>()
        for (const r of requests) {
            const name = r.model.provider.name
            const cogs = estimateProviderCogsUsd({
                inputTokens: r.inputTokens,
                outputTokens: r.outputTokens,
                providerInputPrice: r.model.providerInputPrice.toString(),
                providerOutputPrice: r.model.providerOutputPrice.toString(),
            })
            byProvider.set(name, (byProvider.get(name) ?? 0) + cogs)
        }
        return [...byProvider.entries()]
            .map(([provider, amountUsd]) => ({ provider, amountUsd }))
            .sort((a, b) => a.provider.localeCompare(b.provider))
    }

    private async latestRun(kind: "XENDIT" | "PROVIDER", period: string) {
        const run = await prismaClient.financeReconciliationRun.findFirst({
            where: { kind, period },
            orderBy: { createdAt: "desc" },
        })
        return run ? this.serializeRun(run) : null
    }

    private serializeRun(run: {
        id: string
        kind: string
        period: string
        filename: string | null
        rowCount: number
        matchedCount: number
        driftCount: number
        summaryJson: Prisma.JsonValue
        createdAt: Date
    }) {
        return {
            id: run.id,
            kind: run.kind,
            period: run.period,
            filename: run.filename,
            rowCount: run.rowCount,
            matchedCount: run.matchedCount,
            driftCount: run.driftCount,
            summary: run.summaryJson,
            createdAt: run.createdAt.toISOString(),
        }
    }
}

export default new AdminFinanceService()
