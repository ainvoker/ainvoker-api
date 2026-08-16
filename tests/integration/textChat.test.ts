import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import request from "supertest"
import app from "../../src/app.js"
import { ensureBillingCatalog, getPlanByName, PLAN_NAMES } from "../../src/modules/billing/catalog.js"
import { ensureTextCatalog, textCatalogDefaults } from "../../src/modules/text/catalog.js"
import apiKeyHasher from "../../src/platform/hash.js"
import prismaClient from "../../src/platform/prisma.js"
import { cleanupTestUser, seedUserWithPersonalOrg, testUserId } from "../helpers/db.js"
import "../../src/providers/index.js"

describe("POST /v1/text/chat", () => {
    let userId: string
    let organizationId: string
    let projectId: string
    let plaintextKey: string
    let fetchSpy: ReturnType<typeof vi.spyOn>

    beforeEach(async () => {
        userId = testUserId()
        const seeded = await seedUserWithPersonalOrg(userId)
        organizationId = seeded.organizationId

        const project = await prismaClient.project.create({
            data: {
                organizationId: seeded.organizationId,
                name: `Chat Project ${userId.slice(-8)}`,
                environment: "DEVELOPMENT",
            },
        })
        projectId = project.id

        const generated = apiKeyHasher.generate()
        plaintextKey = generated.plaintext
        await prismaClient.apiKey.create({
            data: {
                projectId,
                keyName: "Chat Test Key",
                keyHash: generated.keyHash,
                keyPrefix: generated.keyPrefix,
                status: "ACTIVE",
            },
        })

        fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
            const url = String(input)
            if (url.includes(":generateContent")) {
                return new Response(
                    JSON.stringify({
                        candidates: [
                            {
                                content: {
                                    role: "model",
                                    parts: [{ text: "Hello from Gemini mock" }],
                                },
                            },
                        ],
                        usageMetadata: {
                            promptTokenCount: 8,
                            candidatesTokenCount: 4,
                            totalTokenCount: 12,
                        },
                    }),
                    { status: 200, headers: { "Content-Type": "application/json" } },
                )
            }

            return new Response(
                JSON.stringify({
                    choices: [{ message: { role: "assistant", content: "Hello from mock" } }],
                    usage: {
                        prompt_tokens: 10,
                        completion_tokens: 5,
                        total_tokens: 15,
                    },
                }),
                { status: 200, headers: { "Content-Type": "application/json" } },
            )
        })
    })

    afterEach(async () => {
        fetchSpy?.mockRestore()
        if (userId) {
            await cleanupTestUser(userId)
        }
    })

    it("returns 401 without Authorization", async () => {
        const res = await request(app.express).post("/v1/text/chat").send({
            model: textCatalogDefaults.modelSlug,
            messages: [{ role: "user", content: "Hi" }],
        })
        expect(res.status).toBe(401)
        expect(res.body.error.code).toBe("UNAUTHORIZED")
    })

    it("returns 401 for a session-style bearer token", async () => {
        const res = await request(app.express)
            .post("/v1/text/chat")
            .set({ Authorization: `Bearer ${userId}` })
            .send({
                model: textCatalogDefaults.modelSlug,
                messages: [{ role: "user", content: "Hi" }],
            })
        expect(res.status).toBe(401)
    })

    it("completes an OpenAI chat and writes an AIRequest", async () => {
        const res = await request(app.express)
            .post("/v1/text/chat")
            .set({ Authorization: `Bearer ${plaintextKey}` })
            .send({
                model: textCatalogDefaults.modelSlug,
                messages: [{ role: "user", content: "Say hello" }],
            })

        expect(res.status).toBe(200)
        expect(res.body.data).toMatchObject({
            model: textCatalogDefaults.modelSlug,
            message: { role: "assistant", content: "Hello from mock" },
            usage: {
                inputTokens: 10,
                outputTokens: 5,
                totalTokens: 15,
            },
        })
        expect(typeof res.body.data.id).toBe("string")
        expect(res.headers["x-ratelimit-limit-requests"]).toBe("300")

        expect(fetchSpy).toHaveBeenCalled()
        const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit]
        expect(url).toContain("/chat/completions")
        expect(init.method).toBe("POST")

        const stored = await prismaClient.aIRequest.findUniqueOrThrow({
            where: { id: res.body.data.id as string },
        })
        expect(stored.requestStatus).toBe("SUCCESS")
        expect(stored.serviceType).toBe("TEXT")
        expect(stored.projectId).toBe(projectId)
        expect(stored.inputTokens).toBe(10)
        expect(stored.outputTokens).toBe(5)
        expect(stored.totalTokens).toBe(15)
    })

    it("completes a Gemini chat and writes an AIRequest", async () => {
        const res = await request(app.express)
            .post("/v1/text/chat")
            .set({ Authorization: `Bearer ${plaintextKey}` })
            .send({
                model: textCatalogDefaults.geminiModelSlug,
                messages: [
                    { role: "system", content: "Be brief" },
                    { role: "user", content: "Say hello" },
                ],
            })

        expect(res.status).toBe(200)
        expect(res.body.data).toMatchObject({
            model: textCatalogDefaults.geminiModelSlug,
            message: { role: "assistant", content: "Hello from Gemini mock" },
            usage: {
                inputTokens: 8,
                outputTokens: 4,
                totalTokens: 12,
            },
        })
        expect(typeof res.body.data.id).toBe("string")

        expect(fetchSpy).toHaveBeenCalled()
        const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit]
        expect(url).toContain(`/models/${textCatalogDefaults.geminiModelSlug.split("/")[1]}:generateContent`)
        expect(init.method).toBe("POST")
        const headers = init.headers as Record<string, string>
        expect(headers["x-goog-api-key"]).toBeTruthy()

        const body = JSON.parse(String(init.body)) as {
            systemInstruction?: { parts: Array<{ text: string }> }
            contents: Array<{ role: string }>
        }
        expect(body.systemInstruction?.parts[0]?.text).toBe("Be brief")
        expect(body.contents[0]?.role).toBe("user")

        const stored = await prismaClient.aIRequest.findUniqueOrThrow({
            where: { id: res.body.data.id as string },
        })
        expect(stored.requestStatus).toBe("SUCCESS")
        expect(stored.serviceType).toBe("TEXT")
        expect(stored.projectId).toBe(projectId)
        expect(stored.inputTokens).toBe(8)
        expect(stored.outputTokens).toBe(4)
        expect(stored.totalTokens).toBe(12)
    })

    it("rejects invalid body", async () => {
        const res = await request(app.express)
            .post("/v1/text/chat")
            .set({ Authorization: `Bearer ${plaintextKey}` })
            .send({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: "Hi" }],
            })
        expect(res.status).toBe(400)
        expect(res.body.error.code).toBe("VALIDATION_ERROR")
    })

    it("returns 429 when Free monthly request limit is exceeded", async () => {
        await ensureTextCatalog()
        const openai = await prismaClient.aIProvider.findUniqueOrThrow({
            where: { name: "openai" },
        })
        const model = await prismaClient.aIModel.findUniqueOrThrow({
            where: {
                providerId_name: { providerId: openai.id, name: "gpt-4o-mini" },
            },
        })

        const apiKey = await prismaClient.apiKey.findFirstOrThrow({
            where: { projectId },
        })

        await prismaClient.aIRequest.create({
            data: {
                projectId,
                apiKeyId: apiKey.id,
                modelId: model.id,
                serviceType: "TEXT",
                requestPayload: { model: textCatalogDefaults.modelSlug },
                requestStatus: "SUCCESS",
                totalTokens: 1,
            },
        })

        const free = await getPlanByName(PLAN_NAMES.free)
        await prismaClient.plan.update({
            where: { id: free.id },
            data: { requestLimit: 1 },
        })

        try {
            const res = await request(app.express)
                .post("/v1/text/chat")
                .set({ Authorization: `Bearer ${plaintextKey}` })
                .send({
                    model: textCatalogDefaults.modelSlug,
                    messages: [{ role: "user", content: "Hi" }],
                })

            expect(res.status).toBe(429)
            expect(res.body.error.code).toBe("RATE_LIMIT_EXCEEDED")
            expect(fetchSpy).not.toHaveBeenCalled()
        } finally {
            await prismaClient.plan.update({
                where: { id: free.id },
                data: { requestLimit: 300 },
            })
        }
    })

    it("returns 403 when Free plan calls a non-eligible model", async () => {
        await ensureTextCatalog()
        const openai = await prismaClient.aIProvider.findUniqueOrThrow({
            where: { name: "openai" },
        })

        await prismaClient.aIModel.upsert({
            where: {
                providerId_name: { providerId: openai.id, name: "gpt-4o" },
            },
            create: {
                providerId: openai.id,
                name: "gpt-4o",
                type: "TEXT",
                contextWindow: 128000,
                inputPrice: 2.5,
                outputPrice: 10,
                status: "ACTIVE",
                freeEligible: false,
            },
            update: {
                status: "ACTIVE",
                freeEligible: false,
            },
        })

        const res = await request(app.express)
            .post("/v1/text/chat")
            .set({ Authorization: `Bearer ${plaintextKey}` })
            .send({
                model: "openai/gpt-4o",
                messages: [{ role: "user", content: "Hi" }],
            })

        expect(res.status).toBe(403)
        expect(res.body.error.code).toBe("MODEL_NOT_ALLOWED_ON_PLAN")
        expect(fetchSpy).not.toHaveBeenCalled()
    })

    it("allows Pro plans to call non-eligible models", async () => {
        await ensureBillingCatalog()
        await ensureTextCatalog()

        const openai = await prismaClient.aIProvider.findUniqueOrThrow({
            where: { name: "openai" },
        })
        await prismaClient.aIModel.upsert({
            where: {
                providerId_name: { providerId: openai.id, name: "gpt-4o" },
            },
            create: {
                providerId: openai.id,
                name: "gpt-4o",
                type: "TEXT",
                contextWindow: 128000,
                inputPrice: 2.5,
                outputPrice: 10,
                status: "ACTIVE",
                freeEligible: false,
            },
            update: {
                status: "ACTIVE",
                freeEligible: false,
            },
        })

        const pro = await getPlanByName(PLAN_NAMES.pro)
        await prismaClient.subscription.updateMany({
            where: { organizationId, status: "ACTIVE" },
            data: { status: "CANCELED" },
        })
        await prismaClient.subscription.create({
            data: {
                organizationId,
                planId: pro.id,
                status: "ACTIVE",
                startedAt: new Date(),
            },
        })

        const res = await request(app.express)
            .post("/v1/text/chat")
            .set({ Authorization: `Bearer ${plaintextKey}` })
            .send({
                model: "openai/gpt-4o",
                messages: [{ role: "user", content: "Hi" }],
            })

        expect(res.status).toBe(200)
        expect(res.body.data.model).toBe("openai/gpt-4o")
        expect(fetchSpy).toHaveBeenCalled()
    })

    it("allows requests without Origin (Node / server SDK)", async () => {
        const res = await request(app.express)
            .post("/v1/text/chat")
            .set({ Authorization: `Bearer ${plaintextKey}` })
            .send({
                model: textCatalogDefaults.modelSlug,
                messages: [{ role: "user", content: "Hi" }],
            })
        expect(res.status).toBe(200)
    })

    it("rejects unlisted browser Origin with ORIGIN_NOT_ALLOWED", async () => {
        const res = await request(app.express)
            .post("/v1/text/chat")
            .set({
                Authorization: `Bearer ${plaintextKey}`,
                Origin: "https://unlisted.example.com",
            })
            .send({
                model: textCatalogDefaults.modelSlug,
                messages: [{ role: "user", content: "Hi" }],
            })

        expect(res.status).toBe(403)
        expect(res.body.error.code).toBe("ORIGIN_NOT_ALLOWED")
        expect(fetchSpy).not.toHaveBeenCalled()
    })

    it("allows a browser Origin listed on this project", async () => {
        await prismaClient.projectAllowedOrigin.create({
            data: {
                projectId,
                origin: "https://app.example.com",
            },
        })

        const res = await request(app.express)
            .post("/v1/text/chat")
            .set({
                Authorization: `Bearer ${plaintextKey}`,
                Origin: "https://app.example.com",
            })
            .send({
                model: textCatalogDefaults.modelSlug,
                messages: [{ role: "user", content: "Hi" }],
            })

        expect(res.status).toBe(200)
        expect(res.headers["access-control-allow-origin"]).toBe("https://app.example.com")
    })

    it("rejects Origin allowed on a different project", async () => {
        const otherProject = await prismaClient.project.create({
            data: {
                organizationId,
                name: `Other Origins ${userId.slice(-8)}`,
                environment: "DEVELOPMENT",
            },
        })
        await prismaClient.projectAllowedOrigin.create({
            data: {
                projectId: otherProject.id,
                origin: "https://other.example.com",
            },
        })

        const res = await request(app.express)
            .post("/v1/text/chat")
            .set({
                Authorization: `Bearer ${plaintextKey}`,
                Origin: "https://other.example.com",
            })
            .send({
                model: textCatalogDefaults.modelSlug,
                messages: [{ role: "user", content: "Hi" }],
            })

        expect(res.status).toBe(403)
        expect(res.body.error.code).toBe("ORIGIN_NOT_ALLOWED")
    })

    it("reflects Access-Control-Allow-Origin on preflight for registered origins", async () => {
        await prismaClient.projectAllowedOrigin.create({
            data: {
                projectId,
                origin: "https://preflight.example.com",
            },
        })

        const allowed = await request(app.express)
            .options("/v1/text/chat")
            .set({
                Origin: "https://preflight.example.com",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "authorization,content-type",
            })

        expect(allowed.status).toBe(204)
        expect(allowed.headers["access-control-allow-origin"]).toBe(
            "https://preflight.example.com",
        )

        const denied = await request(app.express)
            .options("/v1/text/chat")
            .set({
                Origin: "https://denied.example.com",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "authorization,content-type",
            })

        expect(denied.headers["access-control-allow-origin"]).toBeUndefined()
    })
})
