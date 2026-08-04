import request from "supertest"
import { beforeEach, describe, expect, it } from "vitest"
import app from "../../src/app.js"
import apiKeyHasher from "../../src/platform/hash.js"
import prismaClient from "../../src/platform/prisma.js"
import { ensureTextCatalog } from "../../src/modules/text/catalog.js"
import { useTestAuthUser } from "../helpers/fixtures.js"

describe("ai requests endpoints", () => {
    const authUser = useTestAuthUser()
    let projectId = ""
    let apiKeyId = ""
    let modelId = 0

    beforeEach(async () => {
        await ensureTextCatalog()

        const project = await prismaClient.project.create({
            data: {
                organizationId: authUser.auth.organizationId,
                name: `Requests Project ${authUser.auth.userId.slice(-8)}`,
                environment: "DEVELOPMENT",
            },
        })
        projectId = project.id

        const generated = apiKeyHasher.generate()
        const key = await prismaClient.apiKey.create({
            data: {
                projectId,
                keyName: "Log Key",
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
    })

    it("returns 401 without Authorization", async () => {
        const res = await request(app.express).get(`/api/v1/projects/${projectId}/ai-requests`)
        expect(res.status).toBe(401)
    })

    it("lists and gets AI requests for a project member", async () => {
        const listRes = await request(app.express)
            .get(`/api/v1/projects/${projectId}/ai-requests`)
            .set(authUser.headers())

        expect(listRes.status).toBe(200)
        expect(listRes.body.data.total).toBeGreaterThanOrEqual(1)
        expect(listRes.body.data.items[0]).toMatchObject({
            projectId,
            model: "gemini/gemini-2.5-flash",
            serviceType: "TEXT",
            requestStatus: "SUCCESS",
            inputTokens: 3,
            outputTokens: 2,
            totalTokens: 5,
        })
        expect(listRes.body.data.items[0].requestPayload).toBeUndefined()

        const requestId = listRes.body.data.items[0].id as string

        const getRes = await request(app.express)
            .get(`/api/v1/projects/${projectId}/ai-requests/${requestId}`)
            .set(authUser.headers())

        expect(getRes.status).toBe(200)
        expect(getRes.body.data).toMatchObject({
            id: requestId,
            projectId,
            model: "gemini/gemini-2.5-flash",
            requestPayload: {
                model: "gemini/gemini-2.5-flash",
                messages: [{ role: "user", content: "Hi" }],
            },
            responsePayload: {
                message: { role: "assistant", content: "Hello" },
            },
        })
    })

    it("filters by status", async () => {
        const res = await request(app.express)
            .get(`/api/v1/projects/${projectId}/ai-requests`)
            .query({ status: "FAILED" })
            .set(authUser.headers())

        expect(res.status).toBe(200)
        expect(res.body.data.total).toBe(0)
        expect(res.body.data.items).toEqual([])
    })

    it("returns 404 for unknown request", async () => {
        const res = await request(app.express)
            .get(`/api/v1/projects/${projectId}/ai-requests/does-not-exist`)
            .set(authUser.headers())

        expect(res.status).toBe(404)
        expect(res.body.error.code).toBe("NOT_FOUND")
    })
})
