import request from "supertest"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import app from "../../src/app.js"
import env from "../../src/config/env.js"
import { ensureBillingCatalog } from "../../src/modules/billing/catalog.js"
import { currentFinancePeriod } from "../../src/modules/finance/period.js"
import prismaClient from "../../src/platform/prisma.js"
import { useTestAuthUser } from "../helpers/fixtures.js"

describe("admin finance endpoints", () => {
    const authUser = useTestAuthUser({
        profile: {
            email: null,
            firstName: "Admin",
            lastName: "Finance",
        },
    })

    const period = currentFinancePeriod()
    let createdExpenseIds: string[] = []
    let createdTxIds: string[] = []
    let createdRunIds: string[] = []

    beforeEach(async () => {
        vi.spyOn(env, "isPlatformAdmin").mockImplementation(
            (userId) => userId === authUser.auth.userId,
        )
        await ensureBillingCatalog()
        createdExpenseIds = []
        createdTxIds = []
        createdRunIds = []
    })

    afterEach(async () => {
        vi.restoreAllMocks()
        if (createdTxIds.length) {
            await prismaClient.transaction.deleteMany({ where: { id: { in: createdTxIds } } })
        }
        if (createdExpenseIds.length) {
            await prismaClient.expense.deleteMany({ where: { id: { in: createdExpenseIds } } })
        }
        if (createdRunIds.length) {
            await prismaClient.financeReconciliationRun.deleteMany({
                where: { id: { in: createdRunIds } },
            })
        }
        await prismaClient.expense.deleteMany({
            where: { description: { startsWith: "finance-test-" } },
        })
        await prismaClient.financeReconciliationRun.deleteMany({
            where: { filename: { startsWith: "finance-test-" } },
        })
    })

    it("returns 401 without Authorization", async () => {
        const res = await request(app.express).get("/api/v1/admin/finance/overview")
        expect(res.status).toBe(401)
    })

    it("returns 403 for non-admins", async () => {
        vi.spyOn(env, "isPlatformAdmin").mockReturnValue(false)
        const res = await request(app.express)
            .get("/api/v1/admin/finance/overview")
            .query({ period })
            .set(authUser.headers())
        expect(res.status).toBe(403)
    })

    it("returns overview and margin-by-plan shape", async () => {
        const overview = await request(app.express)
            .get("/api/v1/admin/finance/overview")
            .query({ period })
            .set(authUser.headers())
        expect(overview.status).toBe(200)
        expect(overview.body.data).toMatchObject({
            period,
            cashCollectedPhp: expect.any(String),
            providerCogsPhp: expect.any(String),
            expensesPhp: expect.any(String),
            grossMarginPhp: expect.any(String),
            netProfitPhp: expect.any(String),
            requestCount: expect.any(Number),
        })

        const margin = await request(app.express)
            .get("/api/v1/admin/finance/margin-by-plan")
            .query({ period })
            .set(authUser.headers())
        expect(margin.status).toBe(200)
        expect(margin.body.data).toMatchObject({
            period,
            items: expect.any(Array),
        })
    })

    it("creates and patches expenses and feeds overview net profit", async () => {
        const created = await request(app.express)
            .post("/api/v1/admin/finance/expenses")
            .set(authUser.headers())
            .send({
                category: "INFRA",
                amountPhp: 1000,
                period,
                description: "finance-test-hosting",
                notes: "neon",
            })
        expect(created.status).toBe(200)
        createdExpenseIds.push(created.body.data.id as string)
        expect(created.body.data).toMatchObject({
            category: "INFRA",
            amountPhp: "1000.00",
            period,
            description: "finance-test-hosting",
        })

        const patched = await request(app.express)
            .patch(`/api/v1/admin/finance/expenses/${created.body.data.id}`)
            .set(authUser.headers())
            .send({ amountPhp: 1250.5 })
        expect(patched.status).toBe(200)
        expect(patched.body.data.amountPhp).toBe("1250.50")

        const listed = await request(app.express)
            .get("/api/v1/admin/finance/expenses")
            .query({ period })
            .set(authUser.headers())
        expect(listed.status).toBe(200)
        expect(listed.body.data.items.some((e: { id: string }) => e.id === created.body.data.id)).toBe(
            true,
        )

        const overview = await request(app.express)
            .get("/api/v1/admin/finance/overview")
            .query({ period })
            .set(authUser.headers())
        expect(overview.status).toBe(200)
        expect(Number(overview.body.data.expensesPhp)).toBeGreaterThanOrEqual(1250.5)
    })

    it("reconciles Xendit CSV against SUCCEEDED transactions", async () => {
        const sub = await prismaClient.subscription.findFirstOrThrow({
            where: { organizationId: authUser.auth.organizationId, status: "ACTIVE" },
            orderBy: { startedAt: "desc" },
        })

        const matchedRef = `finance-test-match-${Date.now()}`
        const mismatchRef = `finance-test-mismatch-${Date.now()}`
        const dbOnlyRef = `finance-test-dbonly-${Date.now()}`

        const now = new Date()
        const txs = await Promise.all([
            prismaClient.transaction.create({
                data: {
                    subscriptionId: sub.id,
                    amount: 499,
                    paymentMethod: "xendit",
                    referenceNumber: matchedRef,
                    paymentStatus: "SUCCEEDED",
                    createdAt: now,
                },
            }),
            prismaClient.transaction.create({
                data: {
                    subscriptionId: sub.id,
                    amount: 100,
                    paymentMethod: "xendit",
                    referenceNumber: mismatchRef,
                    paymentStatus: "SUCCEEDED",
                    createdAt: now,
                },
            }),
            prismaClient.transaction.create({
                data: {
                    subscriptionId: sub.id,
                    amount: 50,
                    paymentMethod: "xendit",
                    referenceNumber: dbOnlyRef,
                    paymentStatus: "SUCCEEDED",
                    createdAt: now,
                },
            }),
        ])
        createdTxIds.push(...txs.map((t) => t.id))

        const csvText = [
            "reference,amount",
            `${matchedRef},499`,
            `${mismatchRef},120`,
            `finance-test-csvonly-${Date.now()},10`,
        ].join("\n")

        const uploaded = await request(app.express)
            .post("/api/v1/admin/finance/reconciliation/xendit")
            .set(authUser.headers())
            .send({
                period,
                csvText,
                filename: "finance-test-xendit.csv",
            })
        expect(uploaded.status).toBe(200)
        createdRunIds.push(uploaded.body.data.id as string)
        expect(uploaded.body.data.matchedCount).toBe(1)
        expect(uploaded.body.data.driftCount).toBeGreaterThanOrEqual(2)

        const status = await request(app.express)
            .get("/api/v1/admin/finance/reconciliation/xendit")
            .query({ period })
            .set(authUser.headers())
        expect(status.status).toBe(200)
        expect(status.body.data.latestRun?.id).toBe(uploaded.body.data.id)
        expect(status.body.data.internal.transactionCount).toBeGreaterThanOrEqual(3)
    })

    it("uploads provider CSV and returns a run", async () => {
        const uploaded = await request(app.express)
            .post("/api/v1/admin/finance/reconciliation/providers")
            .set(authUser.headers())
            .send({
                period,
                csvText: "provider,amount_usd\nOpenAI,0\n",
                filename: "finance-test-providers.csv",
            })
        expect(uploaded.status).toBe(200)
        createdRunIds.push(uploaded.body.data.id as string)
        expect(uploaded.body.data).toMatchObject({
            kind: "PROVIDER",
            period,
            rowCount: 1,
        })

        const status = await request(app.express)
            .get("/api/v1/admin/finance/reconciliation/providers")
            .query({ period })
            .set(authUser.headers())
        expect(status.status).toBe(200)
        expect(status.body.data.latestRun?.id).toBe(uploaded.body.data.id)
    })
})
