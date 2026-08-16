import request from "supertest"
import { beforeEach, describe, expect, it } from "vitest"
import app from "../../src/app.js"
import apiKeyHasher from "../../src/platform/hash.js"
import prismaClient from "../../src/platform/prisma.js"
import { ensureTextCatalog } from "../../src/modules/text/catalog.js"
import { useTestAuthUser } from "../helpers/fixtures.js"

describe("usage endpoints", () => {
    const authUser = useTestAuthUser()
    let projectId = ""
    let apiKeyId = ""
    let modelId = 0

    beforeEach(async () => {
        await ensureTextCatalog()

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
            where: { name: "gemini-2.5-flash", provider: { name: "gemini" } },
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
                    model: "gemini/gemini-2.5-flash",
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
                    model: "gemini/gemini-2.5-flash",
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
            model: "gemini/gemini-2.5-flash",
        })
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
        expect(res.body.data.keys).toEqual({ total: 1, active: 1 })
        expect(res.body.data.recentRequests.length).toBeGreaterThanOrEqual(2)
        expect(res.body.data.recentRequests[0].projectName).toBeUndefined()
    })

    it("returns 404 for unknown project usage", async () => {
        const res = await request(app.express)
            .get(`/api/v1/projects/does-not-exist/usage`)
            .set(authUser.headers())

        expect(res.status).toBe(404)
        expect(res.body.error.code).toBe("NOT_FOUND")
    })
})
