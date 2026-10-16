import request from "supertest"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import app from "../../src/app.js"
import env from "../../src/config/env.js"
import { currentFinancePeriod } from "../../src/modules/finance/period.js"
import apiKeyHasher from "../../src/platform/hash.js"
import prismaClient from "../../src/platform/prisma.js"
import { useTestAuthUser } from "../helpers/fixtures.js"

describe("admin dashboard endpoint", () => {
    const authUser = useTestAuthUser({
        profile: {
            email: "admin-dashboard@example.com",
            firstName: "Admin",
            lastName: "Dashboard",
        },
    })

    let projectId = ""
    let apiKeyId = ""
    let modelId = 0
    let createdExpenseIds: string[] = []
    let createdTxIds: string[] = []

    beforeEach(async () => {
        vi.spyOn(env, "isPlatformAdmin").mockImplementation(
            (userId) => userId === authUser.auth.userId,
        )
        createdExpenseIds = []
        createdTxIds = []

        const project = await prismaClient.project.create({
            data: {
                organizationId: authUser.auth.organizationId,
                name: `Dashboard Project ${authUser.auth.userId.slice(-8)}`,
                environment: "DEVELOPMENT",
            },
        })
        projectId = project.id

        const generated = apiKeyHasher.generate()
        const key = await prismaClient.apiKey.create({
            data: {
                projectId,
                keyName: "Dashboard Key",
                keyHash: generated.keyHash,
                keyPrefix: generated.keyPrefix,
                status: "ACTIVE",
            },
        })
        apiKeyId = key.id

        const model = await prismaClient.aIModel.findFirstOrThrow({
            where: { name: "gemini-3.6-flash", provider: { name: "gemini" } },
        })
        modelId = model.id

        await prismaClient.aIRequest.create({
            data: {
                projectId,
                apiKeyId,
                modelId,
                serviceType: "TEXT",
                requestStatus: "SUCCESS",
                requestPayload: {
                    model: "gemini/gemini-3.6-flash",
                    messages: [{ role: "user", content: "Hi" }],
                },
                responsePayload: {
                    message: { role: "assistant", content: "Hello" },
                },
                inputTokens: 10,
                outputTokens: 5,
                totalTokens: 15,
                quotaTokens: 15,
                latency: 120,
                requestCost: "0.000100",
            },
        })

        await prismaClient.aIRequest.create({
            data: {
                projectId,
                apiKeyId,
                modelId,
                serviceType: "TEXT",
                requestStatus: "FAILED",
                requestPayload: {
                    model: "gemini/gemini-3.6-flash",
                    messages: [{ role: "user", content: "Fail" }],
                },
                responsePayload: null,
                inputTokens: 4,
                outputTokens: 0,
                totalTokens: 4,
                quotaTokens: 4,
                latency: null,
                requestCost: null,
            },
        })
    })

    afterEach(async () => {
        vi.restoreAllMocks()
        if (createdTxIds.length) {
            await prismaClient.transaction.deleteMany({ where: { id: { in: createdTxIds } } })
        }
        if (createdExpenseIds.length) {
            await prismaClient.expense.deleteMany({ where: { id: { in: createdExpenseIds } } })
        }
        await prismaClient.expense.deleteMany({
            where: { description: { startsWith: "dashboard-test-" } },
        })
    })

    it("returns 401 without Authorization", async () => {
        const res = await request(app.express).get("/api/v1/admin/dashboard")
        expect(res.status).toBe(401)
    })

    it("returns 403 for non-admins", async () => {
        vi.spyOn(env, "isPlatformAdmin").mockReturnValue(false)
        const res = await request(app.express)
            .get("/api/v1/admin/dashboard")
            .set(authUser.headers())
        expect(res.status).toBe(403)
        expect(res.body.error.code).toBe("FORBIDDEN")
    })

    it("returns dashboard shape with daily series and six-month finance", async () => {
        const period = currentFinancePeriod()
        const expense = await prismaClient.expense.create({
            data: {
                category: "INFRA",
                amountPhp: 250,
                period,
                description: "dashboard-test-hosting",
            },
        })
        createdExpenseIds.push(expense.id)

        const sub = await prismaClient.subscription.findFirstOrThrow({
            where: { organizationId: authUser.auth.organizationId, status: "ACTIVE" },
            orderBy: { startedAt: "desc" },
        })
        const tx = await prismaClient.transaction.create({
            data: {
                subscriptionId: sub.id,
                amount: 499,
                paymentMethod: "xendit",
                referenceNumber: `dashboard-test-${Date.now()}`,
                paymentStatus: "SUCCEEDED",
            },
        })
        createdTxIds.push(tx.id)

        const res = await request(app.express)
            .get("/api/v1/admin/dashboard")
            .query({ period, months: 6 })
            .set(authUser.headers())

        expect(res.status).toBe(200)
        expect(res.body.data).toMatchObject({
            period,
            months: 6,
            apiStatus: "ok",
        })
        expect(res.body.data.usage.totals.requests).toBeGreaterThanOrEqual(2)
        expect(res.body.data.usage.totals.successfulRequests).toBeGreaterThanOrEqual(1)
        expect(res.body.data.usage.totals.failedRequests).toBeGreaterThanOrEqual(1)
        expect(Array.isArray(res.body.data.usage.daily)).toBe(true)
        expect(res.body.data.usage.daily.length).toBeGreaterThan(0)

        const today = new Date().toISOString().slice(0, 10)
        const todayPoint = res.body.data.usage.daily.find(
            (d: { date: string }) => d.date === today,
        )
        expect(todayPoint).toBeTruthy()
        expect(todayPoint.requestsUsed).toBeGreaterThanOrEqual(2)
        expect(todayPoint.successfulRequests).toBeGreaterThanOrEqual(1)
        expect(todayPoint.failedRequests).toBeGreaterThanOrEqual(1)
        expect(todayPoint.avgLatency).toEqual(expect.any(Number))
        expect(todayPoint.p95Latency).toEqual(expect.any(Number))

        expect(res.body.data.finance.monthly).toHaveLength(6)
        expect(res.body.data.finance.monthly[5].period).toBe(period)
        expect(Number(res.body.data.finance.monthly[5].cashCollectedPhp)).toBeGreaterThanOrEqual(499)
        expect(Number(res.body.data.finance.monthly[5].expensesPhp)).toBeGreaterThanOrEqual(250)
        expect(Number(res.body.data.finance.overview.netProfitPhp)).toBeCloseTo(
            Number(res.body.data.finance.overview.grossMarginPhp) -
                Number(res.body.data.finance.overview.expensesPhp),
            2,
        )
        expect(Array.isArray(res.body.data.finance.marginByPlan)).toBe(true)
        expect(Array.isArray(res.body.data.usage.byProvider)).toBe(true)
        expect(Array.isArray(res.body.data.usage.nearLimit)).toBe(true)
    })

    it("returns empty daily zeros and ordered months for a quiet past period", async () => {
        const res = await request(app.express)
            .get("/api/v1/admin/dashboard")
            .query({ period: "2020-01", months: 3 })
            .set(authUser.headers())

        expect(res.status).toBe(200)
        expect(res.body.data.period).toBe("2020-01")
        expect(res.body.data.months).toBe(3)
        expect(res.body.data.finance.monthly.map((m: { period: string }) => m.period)).toEqual([
            "2019-11",
            "2019-12",
            "2020-01",
        ])
        expect(res.body.data.usage.daily.length).toBe(31)
        expect(res.body.data.usage.daily.every((d: { requestsUsed: number }) => d.requestsUsed === 0)).toBe(
            true,
        )
        expect(res.body.data.usage.totals.requests).toBe(0)
        expect(Number(res.body.data.finance.overview.cashCollectedPhp)).toBe(0)
    })
})
