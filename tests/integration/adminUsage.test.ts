import request from "supertest"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import app from "../../src/app.js"
import env from "../../src/config/env.js"
import { currentFinancePeriod } from "../../src/modules/finance/period.js"
import apiKeyHasher from "../../src/platform/hash.js"
import prismaClient from "../../src/platform/prisma.js"
import { useTestAuthUser } from "../helpers/fixtures.js"

describe("admin usage endpoints", () => {
    const authUser = useTestAuthUser({
        profile: {
            email: "admin-usage@example.com",
            firstName: "Admin",
            lastName: "Usage",
        },
    })

    let projectId = ""
    let apiKeyId = ""
    let modelId = 0
    let requestId = ""

    beforeEach(async () => {
        vi.spyOn(env, "isPlatformAdmin").mockImplementation(
            (userId) => userId === authUser.auth.userId,
        )

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

        const created = await prismaClient.aIRequest.create({
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
        requestId = created.id
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it("returns 401 without Authorization", async () => {
        const res = await request(app.express).get("/api/v1/admin/usage")
        expect(res.status).toBe(401)
    })

    it("returns 403 for users who are not platform admins", async () => {
        vi.spyOn(env, "isPlatformAdmin").mockReturnValue(false)
        const res = await request(app.express)
            .get("/api/v1/admin/usage")
            .set(authUser.headers())
        expect(res.status).toBe(403)
        expect(res.body.error.code).toBe("FORBIDDEN")
    })

    it("returns platform usage overview for the current period", async () => {
        const period = currentFinancePeriod()
        const res = await request(app.express)
            .get("/api/v1/admin/usage")
            .query({ period })
            .set(authUser.headers())

        expect(res.status).toBe(200)
        expect(res.body.data.period).toBe(period)
        expect(res.body.data.totals.requests).toBeGreaterThanOrEqual(1)
        expect(res.body.data.totals.successfulRequests).toBeGreaterThanOrEqual(1)
        expect(res.body.data.byOrganization.some(
            (row: { organizationId: string }) =>
                row.organizationId === authUser.auth.organizationId,
        )).toBe(true)
        expect(res.body.data.byModel.some(
            (row: { model: string }) => row.model === "gemini/gemini-3.6-flash",
        )).toBe(true)
        expect(res.body.data.byProvider.some(
            (row: { providerName: string }) => row.providerName === "gemini",
        )).toBe(true)
        expect(Array.isArray(res.body.data.nearLimit)).toBe(true)
    })

    it("lists and gets AI requests across workspaces", async () => {
        const listRes = await request(app.express)
            .get("/api/v1/admin/ai-requests")
            .query({ organizationId: authUser.auth.organizationId })
            .set(authUser.headers())

        expect(listRes.status).toBe(200)
        expect(listRes.body.data.total).toBeGreaterThanOrEqual(1)
        expect(listRes.body.data.items[0]).toMatchObject({
            id: requestId,
            projectId,
            organizationId: authUser.auth.organizationId,
            model: "gemini/gemini-3.6-flash",
            requestStatus: "SUCCESS",
            totalTokens: 15,
        })
        expect(listRes.body.data.items[0].requestPayload).toBeUndefined()

        const getRes = await request(app.express)
            .get(`/api/v1/admin/ai-requests/${requestId}`)
            .set(authUser.headers())

        expect(getRes.status).toBe(200)
        expect(getRes.body.data).toMatchObject({
            id: requestId,
            projectId,
            organizationId: authUser.auth.organizationId,
            requestPayload: {
                model: "gemini/gemini-3.6-flash",
                messages: [{ role: "user", content: "Hi" }],
            },
            responsePayload: {
                message: { role: "assistant", content: "Hello" },
            },
        })
    })

    it("returns 404 for an unknown AI request", async () => {
        const res = await request(app.express)
            .get("/api/v1/admin/ai-requests/does-not-exist")
            .set(authUser.headers())
        expect(res.status).toBe(404)
        expect(res.body.error.code).toBe("NOT_FOUND")
    })
})
