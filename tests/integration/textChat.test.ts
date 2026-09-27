import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import request from "supertest"
import app from "../../src/app.js"
import { ensureBillingCatalog, getPlanByName, PLAN_NAMES } from "../../src/modules/billing/catalog.js"
import { ensureTextCatalog, textCatalogDefaults } from "../../src/modules/text/catalog.js"
import {
    DEFAULT_OUTPUT_TOKEN_HOLD,
    estimateTextTokenHold,
} from "../../src/modules/text/tokens.js"
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
        expect(res.body.data.message).not.toHaveProperty("toolCalls")
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
                model: "openai/gpt-4o-mini",
                messages: [],
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

    it("does not exceed monthly request limit under concurrent chats", async () => {
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

        const requestLimit = 3
        const free = await getPlanByName(PLAN_NAMES.free)
        await prismaClient.plan.update({
            where: { id: free.id },
            data: { requestLimit },
        })

        // Seed requestLimit - 1 so only one concurrent slot remains.
        await prismaClient.aIRequest.createMany({
            data: Array.from({ length: requestLimit - 1 }, () => ({
                projectId,
                apiKeyId: apiKey.id,
                modelId: model.id,
                serviceType: "TEXT" as const,
                requestPayload: { model: textCatalogDefaults.modelSlug },
                requestStatus: "SUCCESS" as const,
                totalTokens: 1,
            })),
        })

        try {
            const parallel = 5
            const results = await Promise.all(
                Array.from({ length: parallel }, () =>
                    request(app.express)
                        .post("/v1/text/chat")
                        .set({ Authorization: `Bearer ${plaintextKey}` })
                        .send({
                            model: textCatalogDefaults.modelSlug,
                            messages: [{ role: "user", content: "Hi" }],
                        }),
                ),
            )

            const successes = results.filter((res) => res.status === 200)
            const rateLimited = results.filter((res) => res.status === 429)

            expect(successes).toHaveLength(1)
            expect(rateLimited).toHaveLength(parallel - 1)
            for (const res of rateLimited) {
                expect(res.body.error.code).toBe("RATE_LIMIT_EXCEEDED")
            }
            expect(fetchSpy).toHaveBeenCalledTimes(1)

            const total = await prismaClient.aIRequest.count({
                where: { project: { organizationId } },
            })
            expect(total).toBe(requestLimit)
        } finally {
            await prismaClient.plan.update({
                where: { id: free.id },
                data: { requestLimit: 300 },
            })
        }
    })

    it("returns 429 when the monthly token limit cannot fit another hold", async () => {
        const free = await getPlanByName(PLAN_NAMES.free)
        const hold = estimateTextTokenHold([{ content: "Hi" }], undefined)
        await prismaClient.plan.update({
            where: { id: free.id },
            data: { tokenLimit: hold.inputTokens },
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
                data: { tokenLimit: 50_000 },
            })
        }
    })

    it("does not exceed monthly token limit under concurrent chats", async () => {
        const message = "Hi"
        const hold = estimateTextTokenHold([{ content: message }], undefined)
        const reservation = hold.inputTokens + hold.outputTokens
        const admitted = 2
        const parallel = 5
        const free = await getPlanByName(PLAN_NAMES.free)
        await prismaClient.plan.update({
            where: { id: free.id },
            data: { tokenLimit: reservation * admitted },
        })

        // Hold the provider call open so the other chats reserve while this one
        // is still in flight. Usage matches the hold so a finished chat does not
        // free budget for the rest of the batch.
        const previousFetch = fetchSpy.getMockImplementation()
        fetchSpy.mockImplementation(async () => {
            await new Promise((resolve) => setTimeout(resolve, 1500))
            return new Response(
                JSON.stringify({
                    choices: [{ message: { role: "assistant", content: "Hello from mock" } }],
                    usage: {
                        prompt_tokens: hold.inputTokens,
                        completion_tokens: hold.outputTokens,
                        total_tokens: reservation,
                    },
                }),
                { status: 200, headers: { "Content-Type": "application/json" } },
            )
        })

        try {
            const results = await Promise.all(
                Array.from({ length: parallel }, () =>
                    request(app.express)
                        .post("/v1/text/chat")
                        .set({ Authorization: `Bearer ${plaintextKey}` })
                        .send({
                            model: textCatalogDefaults.modelSlug,
                            messages: [{ role: "user", content: message }],
                        }),
                ),
            )

            const successes = results.filter((res) => res.status === 200)
            const rateLimited = results.filter((res) => res.status === 429)

            expect(successes).toHaveLength(admitted)
            expect(rateLimited).toHaveLength(parallel - admitted)
            for (const res of rateLimited) {
                expect(res.body.error.code).toBe("RATE_LIMIT_EXCEEDED")
            }
            expect(fetchSpy).toHaveBeenCalledTimes(admitted)

            const providerBody = JSON.parse(String(fetchSpy.mock.calls[0]?.[1]?.body)) as {
                max_tokens?: number
            }
            expect(providerBody.max_tokens).toBe(DEFAULT_OUTPUT_TOKEN_HOLD)

            const used = await prismaClient.aIRequest.aggregate({
                where: { project: { organizationId } },
                _sum: { totalTokens: true },
            })
            expect(used._sum.totalTokens).toBe(reservation * admitted)
        } finally {
            if (previousFetch) {
                fetchSpy.mockImplementation(previousFetch)
            }
            await prismaClient.plan.update({
                where: { id: free.id },
                data: { tokenLimit: 50_000 },
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

    it("resolves a unique bare model name", async () => {
        const res = await request(app.express)
            .post("/v1/text/chat")
            .set({ Authorization: `Bearer ${plaintextKey}` })
            .send({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: "Hi" }],
            })

        expect(res.status).toBe(200)
        expect(res.body.data.model).toBe(textCatalogDefaults.modelSlug)
    })

    it("rejects an ambiguous bare model name", async () => {
        await ensureTextCatalog()
        const gemini = await prismaClient.aIProvider.findUniqueOrThrow({
            where: { name: "gemini" },
        })
        await prismaClient.aIModel.upsert({
            where: {
                providerId_name: { providerId: gemini.id, name: "gpt-4o-mini" },
            },
            create: {
                providerId: gemini.id,
                name: "gpt-4o-mini",
                type: "TEXT",
                contextWindow: 128000,
                inputPrice: 0,
                outputPrice: 0,
                status: "ACTIVE",
                freeEligible: true,
            },
            update: {
                status: "ACTIVE",
                freeEligible: true,
            },
        })

        const res = await request(app.express)
            .post("/v1/text/chat")
            .set({ Authorization: `Bearer ${plaintextKey}` })
            .send({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: "Hi" }],
            })

        expect(res.status).toBe(400)
        expect(res.body.error.code).toBe("VALIDATION_ERROR")
        expect(String(res.body.error.message)).toMatch(/ambiguous/i)
        expect(fetchSpy).not.toHaveBeenCalled()

        await prismaClient.aIModel.delete({
            where: {
                providerId_name: { providerId: gemini.id, name: "gpt-4o-mini" },
            },
        })
    })

    it("returns 404 for an unknown bare model name", async () => {
        const res = await request(app.express)
            .post("/v1/text/chat")
            .set({ Authorization: `Bearer ${plaintextKey}` })
            .send({
                model: "not-a-real-model",
                messages: [{ role: "user", content: "Hi" }],
            })

        expect(res.status).toBe(404)
        expect(res.body.error.code).toBe("NOT_FOUND")
        expect(fetchSpy).not.toHaveBeenCalled()
    })

    it("rejects a disabled project model even when the plan allows it", async () => {
        await ensureTextCatalog()
        const openai = await prismaClient.aIProvider.findUniqueOrThrow({
            where: { name: "openai" },
        })
        const model = await prismaClient.aIModel.findUniqueOrThrow({
            where: {
                providerId_name: { providerId: openai.id, name: "gpt-4o-mini" },
            },
        })

        await prismaClient.projectModelAllow.upsert({
            where: {
                projectId_modelId: { projectId, modelId: model.id },
            },
            create: {
                projectId,
                modelId: model.id,
                enabled: false,
            },
            update: { enabled: false },
        })

        const res = await request(app.express)
            .post("/v1/text/chat")
            .set({ Authorization: `Bearer ${plaintextKey}` })
            .send({
                model: textCatalogDefaults.modelSlug,
                messages: [{ role: "user", content: "Hi" }],
            })

        expect(res.status).toBe(403)
        expect(res.body.error.code).toBe("MODEL_DISABLED")
        expect(fetchSpy).not.toHaveBeenCalled()
    })

    describe("tool calling", () => {
        const weatherTool = {
            name: "get_weather",
            description: "Current weather for a city",
            parameters: {
                type: "object",
                properties: { city: { type: "string" } },
                required: ["city"],
            },
        }

        const priorToolTurn = [
            { role: "user", content: "Weather in Manila?" },
            {
                role: "assistant",
                content: "",
                toolCalls: [
                    { id: "call_abc", name: "get_weather", arguments: { city: "Manila" } },
                ],
            },
            {
                role: "tool",
                toolCallId: "call_abc",
                name: "get_weather",
                content: '{"tempC":31}',
            },
        ]

        it("returns toolCalls with empty content and stores them", async () => {
            fetchSpy.mockImplementation(async () =>
                new Response(
                    JSON.stringify({
                        choices: [
                            {
                                message: {
                                    role: "assistant",
                                    content: null,
                                    tool_calls: [
                                        {
                                            id: "call_abc",
                                            type: "function",
                                            function: {
                                                name: "get_weather",
                                                arguments: '{"city":"Manila"}',
                                            },
                                        },
                                    ],
                                },
                                finish_reason: "tool_calls",
                            },
                        ],
                        usage: { prompt_tokens: 20, completion_tokens: 7, total_tokens: 27 },
                    }),
                    { status: 200, headers: { "Content-Type": "application/json" } },
                ),
            )

            const res = await request(app.express)
                .post("/v1/text/chat")
                .set({ Authorization: `Bearer ${plaintextKey}` })
                .send({
                    model: textCatalogDefaults.modelSlug,
                    messages: [{ role: "user", content: "Weather in Manila?" }],
                    tools: [weatherTool],
                })

            expect(res.status).toBe(200)
            expect(res.body.data.message).toEqual({
                role: "assistant",
                content: "",
                toolCalls: [{ id: "call_abc", name: "get_weather", arguments: { city: "Manila" } }],
            })

            const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit]
            const upstream = JSON.parse(String(init.body)) as { tools: unknown }
            expect(upstream.tools).toEqual([
                {
                    type: "function",
                    function: {
                        name: weatherTool.name,
                        description: weatherTool.description,
                        parameters: weatherTool.parameters,
                    },
                },
            ])

            const stored = await prismaClient.aIRequest.findUniqueOrThrow({
                where: { id: res.body.data.id as string },
            })
            expect(stored.requestStatus).toBe("SUCCESS")
            expect(stored.requestPayload).toMatchObject({ tools: [weatherTool] })
            expect(stored.responsePayload).toMatchObject({
                message: {
                    content: "",
                    toolCalls: [{ id: "call_abc", name: "get_weather" }],
                },
            })
        })

        it("forwards a prior assistant tool call and tool result to OpenAI", async () => {
            const res = await request(app.express)
                .post("/v1/text/chat")
                .set({ Authorization: `Bearer ${plaintextKey}` })
                .send({
                    model: textCatalogDefaults.modelSlug,
                    messages: priorToolTurn,
                    tools: [weatherTool],
                })

            expect(res.status).toBe(200)
            expect(res.body.data.message).toEqual({ role: "assistant", content: "Hello from mock" })

            const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit]
            const upstream = JSON.parse(String(init.body)) as { messages: unknown[] }
            expect(upstream.messages).toEqual([
                { role: "user", content: "Weather in Manila?" },
                {
                    role: "assistant",
                    content: "",
                    tool_calls: [
                        {
                            id: "call_abc",
                            type: "function",
                            function: { name: "get_weather", arguments: '{"city":"Manila"}' },
                        },
                    ],
                },
                { role: "tool", tool_call_id: "call_abc", content: '{"tempC":31}' },
            ])
        })

        it("forwards a prior tool call and tool result to Gemini", async () => {
            const res = await request(app.express)
                .post("/v1/text/chat")
                .set({ Authorization: `Bearer ${plaintextKey}` })
                .send({
                    model: textCatalogDefaults.geminiModelSlug,
                    messages: priorToolTurn,
                    tools: [weatherTool],
                    reasoning: "low",
                })

            expect(res.status).toBe(200)

            const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit]
            const upstream = JSON.parse(String(init.body)) as {
                contents: unknown[]
                tools: unknown
                generationConfig: { thinkingConfig?: unknown }
            }
            expect(upstream.contents).toEqual([
                { role: "user", parts: [{ text: "Weather in Manila?" }] },
                {
                    role: "model",
                    parts: [{ functionCall: { name: "get_weather", args: { city: "Manila" } } }],
                },
                {
                    role: "user",
                    parts: [
                        {
                            functionResponse: {
                                name: "get_weather",
                                response: { result: '{"tempC":31}' },
                            },
                        },
                    ],
                },
            ])
            expect(upstream.tools).toEqual([
                {
                    functionDeclarations: [
                        {
                            name: weatherTool.name,
                            description: weatherTool.description,
                            parametersJsonSchema: weatherTool.parameters,
                        },
                    ],
                },
            ])
            expect(upstream.generationConfig.thinkingConfig).toEqual({ thinkingLevel: "low" })
        })

        it("assigns call_${index} ids when Gemini omits them", async () => {
            fetchSpy.mockImplementation(async () =>
                new Response(
                    JSON.stringify({
                        candidates: [
                            {
                                content: {
                                    role: "model",
                                    parts: [
                                        { functionCall: { name: "get_weather", args: { city: "Manila" } } },
                                        { functionCall: { name: "get_weather", args: { city: "Cebu" } } },
                                    ],
                                },
                            },
                        ],
                        usageMetadata: { promptTokenCount: 8, candidatesTokenCount: 4, totalTokenCount: 12 },
                    }),
                    { status: 200, headers: { "Content-Type": "application/json" } },
                ),
            )

            const res = await request(app.express)
                .post("/v1/text/chat")
                .set({ Authorization: `Bearer ${plaintextKey}` })
                .send({
                    model: textCatalogDefaults.geminiModelSlug,
                    messages: [{ role: "user", content: "Weather in Manila and Cebu?" }],
                    tools: [weatherTool],
                })

            expect(res.status).toBe(200)
            expect(res.body.data.message).toEqual({
                role: "assistant",
                content: "",
                toolCalls: [
                    { id: "call_0", name: "get_weather", arguments: { city: "Manila" } },
                    { id: "call_1", name: "get_weather", arguments: { city: "Cebu" } },
                ],
            })
        })

        it("returns the Gemini thought signature as providerMetadata", async () => {
            fetchSpy.mockImplementation(async () =>
                new Response(
                    JSON.stringify({
                        candidates: [
                            {
                                content: {
                                    role: "model",
                                    parts: [
                                        {
                                            functionCall: { id: "g1", name: "get_weather", args: { city: "Manila" } },
                                            thoughtSignature: "sig-abc",
                                        },
                                    ],
                                },
                            },
                        ],
                        usageMetadata: { promptTokenCount: 8, candidatesTokenCount: 4, totalTokenCount: 12 },
                    }),
                    { status: 200, headers: { "Content-Type": "application/json" } },
                ),
            )

            const res = await request(app.express)
                .post("/v1/text/chat")
                .set({ Authorization: `Bearer ${plaintextKey}` })
                .send({
                    model: textCatalogDefaults.geminiModelSlug,
                    messages: [{ role: "user", content: "Weather in Manila?" }],
                    tools: [weatherTool],
                })

            expect(res.status).toBe(200)
            expect(res.body.data.message.toolCalls).toEqual([
                {
                    id: "g1",
                    name: "get_weather",
                    arguments: { city: "Manila" },
                    providerMetadata: { gemini: { thoughtSignature: "sig-abc" } },
                },
            ])
        })

        it("replays providerMetadata.gemini.thoughtSignature on the functionCall part", async () => {
            const [user, assistant, tool] = priorToolTurn as [
                Record<string, unknown>,
                { toolCalls: Record<string, unknown>[] } & Record<string, unknown>,
                Record<string, unknown>,
            ]
            const res = await request(app.express)
                .post("/v1/text/chat")
                .set({ Authorization: `Bearer ${plaintextKey}` })
                .send({
                    model: textCatalogDefaults.geminiModelSlug,
                    messages: [
                        user,
                        {
                            ...assistant,
                            toolCalls: assistant.toolCalls.map((call) => ({
                                ...call,
                                providerMetadata: { gemini: { thoughtSignature: "sig-abc" } },
                            })),
                        },
                        tool,
                    ],
                    tools: [weatherTool],
                })

            expect(res.status).toBe(200)
            const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit]
            const upstream = JSON.parse(String(init.body)) as { contents: unknown[] }
            expect(upstream.contents[1]).toEqual({
                role: "model",
                parts: [
                    {
                        functionCall: { name: "get_weather", args: { city: "Manila" } },
                        thoughtSignature: "sig-abc",
                    },
                ],
            })
        })

        it("rejects a duplicate tool name", async () => {
            const res = await request(app.express)
                .post("/v1/text/chat")
                .set({ Authorization: `Bearer ${plaintextKey}` })
                .send({
                    model: textCatalogDefaults.modelSlug,
                    messages: [{ role: "user", content: "Hi" }],
                    tools: [weatherTool, weatherTool],
                })

            expect(res.status).toBe(400)
            expect(res.body.error.code).toBe("VALIDATION_ERROR")
            expect(String(res.body.error.message)).toMatch(/duplicate tool name/)
            expect(fetchSpy).not.toHaveBeenCalled()
        })

        it("rejects an assistant message with empty content and no toolCalls", async () => {
            const res = await request(app.express)
                .post("/v1/text/chat")
                .set({ Authorization: `Bearer ${plaintextKey}` })
                .send({
                    model: textCatalogDefaults.modelSlug,
                    messages: [
                        { role: "user", content: "Hi" },
                        { role: "assistant", content: "" },
                        { role: "user", content: "Hello?" },
                    ],
                })

            expect(res.status).toBe(400)
            expect(res.body.error.code).toBe("VALIDATION_ERROR")
            expect(fetchSpy).not.toHaveBeenCalled()
        })

        it("rejects a tool message missing toolCallId", async () => {
            const res = await request(app.express)
                .post("/v1/text/chat")
                .set({ Authorization: `Bearer ${plaintextKey}` })
                .send({
                    model: textCatalogDefaults.modelSlug,
                    messages: [
                        priorToolTurn[0],
                        priorToolTurn[1],
                        { role: "tool", name: "get_weather", content: '{"tempC":31}' },
                    ],
                })

            expect(res.status).toBe(400)
            expect(res.body.error.code).toBe("VALIDATION_ERROR")
            expect(fetchSpy).not.toHaveBeenCalled()
        })
    })
})
