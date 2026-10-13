import request from "supertest"
import { beforeEach, describe, expect, it } from "vitest"
import app from "../../src/app.js"
import { PLAN_NAMES } from "../../src/modules/billing/catalog.js"
import { proRenewsAt } from "../../src/modules/billing/period.js"
import apiKeyHasher from "../../src/platform/hash.js"
import prismaClient from "../../src/platform/prisma.js"
import { useTestAuthUser } from "../helpers/fixtures.js"

const DAY_MS = 86_400_000

/** Number of UTC days from the period's start day through today, inclusive. */
function daysThroughToday(periodStart: string): number {
    const start = new Date(periodStart)
    const now = new Date()
    return (
        (Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) -
            Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())) /
            DAY_MS +
        1
    )
}

function monthKey(date: Date): string {
    return date.toISOString().slice(0, 7)
}

describe("usage endpoints", () => {
    const authUser = useTestAuthUser()
    let projectId = ""
    let apiKeyId = ""
    let modelId = 0

    beforeEach(async () => {
        const project = await prismaClient.project.create({
            data: {
                organizationId: authUser.auth.organizationId,
                name: `Usage Project ${authUser.auth.userId.slice(-8)}`,
                environment: "DEVELOPMENT",
            },
        })
        projectId = project.id

        const generated = apiKeyHasher.generate()
        const key = await prismaClient.apiKey.create({
            data: {
                projectId,
                keyName: "Usage Key",
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
                inputTokens: 3,
                outputTokens: 2,
                totalTokens: 5,
                latency: 120,
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
                inputTokens: 1,
                outputTokens: 0,
                totalTokens: 1,
                latency: null,
            },
        })
    })

    it("returns 401 without Authorization for org usage", async () => {
        const res = await request(app.express).get(
            `/api/v1/organizations/${authUser.auth.organizationId}/usage`,
        )
        expect(res.status).toBe(401)
    })

    it("returns organization usage for a member", async () => {
        const res = await request(app.express)
            .get(`/api/v1/organizations/${authUser.auth.organizationId}/usage`)
            .set(authUser.headers())

        expect(res.status).toBe(200)
        expect(res.body.data.plan).toMatchObject({
            planName: expect.any(String),
            status: expect.any(String),
            requestLimit: expect.any(Number),
            tokenLimit: expect.any(Number),
        })
        expect(res.body.data.period).toMatchObject({
            requestsUsed: expect.any(Number),
            tokensUsed: expect.any(Number),
            successfulRequests: expect.any(Number),
            failedRequests: expect.any(Number),
            periodStart: expect.any(String),
        })
        expect(res.body.data.period.requestsUsed).toBeGreaterThanOrEqual(2)
        expect(res.body.data.period.successfulRequests).toBeGreaterThanOrEqual(1)
        expect(res.body.data.period.failedRequests).toBeGreaterThanOrEqual(1)

        const projectRow = res.body.data.projects.find((p: { id: string }) => p.id === projectId)
        expect(projectRow).toMatchObject({
            id: projectId,
            requestsUsed: 2,
            tokensUsed: 6,
        })

        expect(res.body.data.recentRequests.length).toBeGreaterThanOrEqual(1)
        expect(res.body.data.recentRequests[0]).toMatchObject({
            projectId,
            projectName: expect.any(String),
            model: "gemini/gemini-3.6-flash",
        })

        expect(res.body.data.range).toBe("current_period")
        expect(res.body.data.quota).toMatchObject({
            requestsUsed: res.body.data.period.requestsUsed,
            periodStart: res.body.data.plan.periodStart,
        })
        expect(res.body.data.daily).toHaveLength(daysThroughToday(res.body.data.period.periodStart))
        expect(res.body.data.daily[0]).toMatchObject({
            date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
            requestsUsed: expect.any(Number),
            tokensUsed: expect.any(Number),
            successfulRequests: expect.any(Number),
            failedRequests: expect.any(Number),
        })
        expect(Array.isArray(res.body.data.dailyByProject)).toBe(true)
        expect(Array.isArray(res.body.data.dailyByModel)).toBe(true)
        if (res.body.data.dailyByProject.length > 0) {
            expect(res.body.data.dailyByProject[0]).toMatchObject({
                date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
                id: expect.any(String),
                name: expect.any(String),
                requestsUsed: expect.any(Number),
                tokensUsed: expect.any(Number),
            })
        }
        if (res.body.data.dailyByModel.length > 0) {
            expect(res.body.data.dailyByModel[0]).toMatchObject({
                date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
                id: expect.any(String),
                name: expect.any(String),
                requestsUsed: expect.any(Number),
                tokensUsed: expect.any(Number),
            })
        }
        const dailyRequests = res.body.data.daily.reduce(
            (sum: number, d: { requestsUsed: number }) => sum + d.requestsUsed,
            0,
        )
        expect(dailyRequests).toBe(res.body.data.period.requestsUsed)
    })

    it("returns 401 without Authorization for project usage", async () => {
        const res = await request(app.express).get(`/api/v1/projects/${projectId}/usage`)
        expect(res.status).toBe(401)
    })

    it("returns project usage for a member", async () => {
        const res = await request(app.express)
            .get(`/api/v1/projects/${projectId}/usage`)
            .set(authUser.headers())

        expect(res.status).toBe(200)
        expect(res.body.data.project).toMatchObject({
            id: projectId,
            organizationId: authUser.auth.organizationId,
        })
        expect(res.body.data.period).toMatchObject({
            requestsUsed: 2,
            tokensUsed: 6,
            successfulRequests: 1,
            failedRequests: 1,
            avgLatency: 120,
        })
        expect(res.body.data.organizationPeriod).toMatchObject({
            requestsUsed: expect.any(Number),
            tokensUsed: expect.any(Number),
        })
        expect(res.body.data.organizationPeriod.requestsUsed).toBeGreaterThanOrEqual(2)
        expect(res.body.data.keys).toEqual({ total: 1, active: 1 })
        expect(res.body.data.byModel.length).toBeGreaterThanOrEqual(1)
        expect(res.body.data.byModel[0]).toMatchObject({
            model: "gemini/gemini-3.6-flash",
            requestsUsed: 2,
            tokensUsed: 6,
        })
        const daysElapsed = daysThroughToday(res.body.data.period.periodStart)
        expect(res.body.data.daily).toHaveLength(daysElapsed)
        expect(res.body.data.organizationDaily).toHaveLength(daysElapsed)
        expect(res.body.data.recentRequests.length).toBeGreaterThanOrEqual(2)
        expect(res.body.data.recentRequests[0].projectName).toBeUndefined()
    })

    it("returns 401 without Authorization for project analytics", async () => {
        const res = await request(app.express).get(`/api/v1/projects/${projectId}/analytics`)
        expect(res.status).toBe(401)
    })

    it("returns project analytics for the current billing period by default", async () => {
        const res = await request(app.express)
            .get(`/api/v1/projects/${projectId}/analytics`)
            .set(authUser.headers())

        expect(res.status).toBe(200)
        const data = res.body.data
        expect(data.range).toBe("current_period")
        expect(data.period).toMatchObject({
            requestsUsed: 2,
            tokensUsed: 6,
            inputTokens: 4,
            outputTokens: 2,
            successfulRequests: 1,
            failedRequests: 1,
            totalCost: expect.any(String),
        })
        expect(data.latency).toEqual({ avg: 120, p50: 120, p95: 120 })
        expect(data.organizationPeriod.requestsUsed).toBeGreaterThanOrEqual(2)
        expect(data.byModel[0]).toMatchObject({
            model: "gemini/gemini-3.6-flash",
            requestsUsed: 2,
            tokensUsed: 6,
        })
        expect(data.byApiKey).toEqual([
            {
                apiKeyId,
                keyName: "Usage Key",
                keyPrefix: expect.any(String),
                requestsUsed: 2,
                tokensUsed: 6,
            },
        ])
        expect(data.daily).toHaveLength(daysThroughToday(data.period.periodStart))
        expect(data.dailyByModel[0]).toMatchObject({ requestsUsed: 2, tokensUsed: 6 })
        expect(data.dailyByApiKey[0]).toMatchObject({
            id: apiKeyId,
            name: "Usage Key",
            requestsUsed: 2,
        })
        expect(data.recentRequests).toHaveLength(2)
    })

    it("returns rolling ranges with one daily point per day", async () => {
        for (const [range, days] of [
            ["7d", 7],
            ["30d", 30],
        ] as const) {
            const res = await request(app.express)
                .get(`/api/v1/projects/${projectId}/analytics?range=${range}`)
                .set(authUser.headers())

            expect(res.status).toBe(200)
            expect(res.body.data.range).toBe(range)
            expect(res.body.data.daily).toHaveLength(days)
            expect(res.body.data.period.requestsUsed).toBe(2)
        }
    })

    it("returns a past calendar month and a custom range for the organization", async () => {
        await prismaClient.aIRequest.create({
            data: {
                projectId,
                apiKeyId,
                modelId,
                serviceType: "TEXT",
                requestStatus: "SUCCESS",
                requestPayload: { model: "gemini/gemini-3.6-flash", messages: [] },
                inputTokens: 10,
                outputTokens: 10,
                totalTokens: 20,
                latency: 100,
                createdAt: new Date("2025-03-10T12:00:00.000Z"),
            },
        })
        const base = `/api/v1/organizations/${authUser.auth.organizationId}/usage`

        const month = await request(app.express)
            .get(`${base}?range=calendar_month&month=2025-03`)
            .set(authUser.headers())
        expect(month.status).toBe(200)
        expect(month.body.data.range).toBe("calendar_month")
        expect(month.body.data.period).toMatchObject({
            requestsUsed: 1,
            tokensUsed: 20,
            periodStart: "2025-03-01T00:00:00.000Z",
            periodEnd: "2025-04-01T00:00:00.000Z",
        })
        expect(month.body.data.daily).toHaveLength(31)
        expect(month.body.data.quota.requestsUsed).toBe(2)

        const custom = await request(app.express)
            .get(`${base}?range=custom&from=2025-03-01&to=${new Date().toISOString().slice(0, 10)}`)
            .set(authUser.headers())
        expect(custom.status).toBe(200)
        expect(custom.body.data.period).toMatchObject({ requestsUsed: 3, tokensUsed: 26 })
    })

    it("rejects incomplete or inverted range queries", async () => {
        const base = `/api/v1/organizations/${authUser.auth.organizationId}/usage`
        for (const query of [
            "range=calendar_month",
            "range=custom&from=2025-03-01",
            "range=custom&from=2025-04-01&to=2025-03-01",
        ]) {
            const res = await request(app.express).get(`${base}?${query}`).set(authUser.headers())
            expect(res.status).toBe(400)
        }
    })

    it("gives a PENDING workspace zero quota", async () => {
        const created = await request(app.express)
            .post("/api/v1/organizations")
            .set(authUser.headers())
            .send({ name: `Pending Usage ${authUser.auth.userId.slice(-6)}`, plan: PLAN_NAMES.pro })
        expect(created.status).toBe(201)

        const res = await request(app.express)
            .get(`/api/v1/organizations/${created.body.data.id as string}/usage`)
            .set(authUser.headers())

        expect(res.status).toBe(200)
        expect(res.body.data.plan).toMatchObject({
            status: "PENDING",
            entitled: false,
            requestLimit: 0,
            tokenLimit: 0,
            periodStart: null,
        })
        expect(res.body.data.quota).toBeNull()
        expect(res.body.data.availableMonths).toEqual([])
    })

    it("counts quota from the payment date and lists the months the plan spans", async () => {
        const created = await request(app.express)
            .post("/api/v1/organizations")
            .set(authUser.headers())
            .send({ name: `Paid Usage ${authUser.auth.userId.slice(-6)}`, plan: PLAN_NAMES.pro })
        expect(created.status).toBe(201)
        const orgId = created.body.data.id as string

        const startedAt = new Date(Date.now() - 3 * DAY_MS)
        const expiresAt = proRenewsAt(startedAt)
        await prismaClient.subscription.updateMany({
            where: { organizationId: orgId, status: "PENDING" },
            data: { status: "ACTIVE", startedAt, expiresAt },
        })

        const project = await prismaClient.project.create({
            data: { organizationId: orgId, name: "Paid Project", environment: "DEVELOPMENT" },
        })
        const generated = apiKeyHasher.generate()
        const key = await prismaClient.apiKey.create({
            data: {
                projectId: project.id,
                keyName: "Paid Key",
                keyHash: generated.keyHash,
                keyPrefix: generated.keyPrefix,
                status: "ACTIVE",
            },
        })
        for (const createdAt of [new Date(startedAt.getTime() - DAY_MS), new Date()]) {
            await prismaClient.aIRequest.create({
                data: {
                    projectId: project.id,
                    apiKeyId: key.id,
                    modelId,
                    serviceType: "TEXT",
                    requestStatus: "SUCCESS",
                    requestPayload: { model: "gemini/gemini-3.6-flash", messages: [] },
                    inputTokens: 1,
                    outputTokens: 1,
                    totalTokens: 2,
                    createdAt,
                },
            })
        }

        const res = await request(app.express)
            .get(`/api/v1/organizations/${orgId}/usage`)
            .set(authUser.headers())
        expect(res.status).toBe(200)
        expect(res.body.data.plan).toMatchObject({
            entitled: true,
            periodStart: startedAt.toISOString(),
            periodEnd: expiresAt.toISOString(),
        })
        expect(res.body.data.quota.requestsUsed).toBe(1)
        expect(res.body.data.daily).toHaveLength(4)
        expect(res.body.data.availableMonths).toEqual(
            [...new Set([monthKey(expiresAt), monthKey(startedAt)])],
        )

        const week = await request(app.express)
            .get(`/api/v1/organizations/${orgId}/usage?range=7d`)
            .set(authUser.headers())
        expect(week.body.data.period.requestsUsed).toBe(2)
        expect(week.body.data.quota.requestsUsed).toBe(1)
    })

    it("rejects an unknown analytics range", async () => {
        const res = await request(app.express)
            .get(`/api/v1/projects/${projectId}/analytics?range=1y`)
            .set(authUser.headers())

        expect(res.status).toBe(400)
    })

    it("returns 404 for unknown project analytics", async () => {
        const res = await request(app.express)
            .get(`/api/v1/projects/does-not-exist/analytics`)
            .set(authUser.headers())

        expect(res.status).toBe(404)
    })

    it("returns 404 for unknown project usage", async () => {
        const res = await request(app.express)
            .get(`/api/v1/projects/does-not-exist/usage`)
            .set(authUser.headers())

        expect(res.status).toBe(404)
        expect(res.body.error.code).toBe("NOT_FOUND")
    })
})
