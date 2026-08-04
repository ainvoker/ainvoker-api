import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import request from "supertest"
import app from "../../src/app.js"
import apiKeyHasher from "../../src/platform/hash.js"
import prismaClient from "../../src/platform/prisma.js"
import { cleanupTestUser, seedUserWithPersonalOrg, testUserId } from "../helpers/db.js"
import "../../src/providers/index.js"

describe("POST /v1/text/chat", () => {
    let userId: string
    let projectId: string
    let plaintextKey: string
    let fetchSpy: ReturnType<typeof vi.spyOn>

    beforeEach(async () => {
        userId = testUserId()
        const seeded = await seedUserWithPersonalOrg(userId)

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
        fetchSpy.mockRestore()
        await cleanupTestUser(userId)
    })

    it("returns 401 without Authorization", async () => {
        const res = await request(app.express).post("/v1/text/chat").send({
            model: "openai/gpt-4o-mini",
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
                model: "openai/gpt-4o-mini",
                messages: [{ role: "user", content: "Hi" }],
            })
        expect(res.status).toBe(401)
    })

    it("completes an OpenAI chat and writes an AIRequest", async () => {
        const res = await request(app.express)
            .post("/v1/text/chat")
            .set({ Authorization: `Bearer ${plaintextKey}` })
            .send({
                model: "openai/gpt-4o-mini",
                messages: [{ role: "user", content: "Say hello" }],
            })

        expect(res.status).toBe(200)
        expect(res.body.data).toMatchObject({
            model: "openai/gpt-4o-mini",
            message: { role: "assistant", content: "Hello from mock" },
            usage: {
                inputTokens: 10,
                outputTokens: 5,
                totalTokens: 15,
            },
        })
        expect(typeof res.body.data.id).toBe("string")

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
                model: "gemini/gemini-2.5-flash",
                messages: [
                    { role: "system", content: "Be brief" },
                    { role: "user", content: "Say hello" },
                ],
            })

        expect(res.status).toBe(200)
        expect(res.body.data).toMatchObject({
            model: "gemini/gemini-2.5-flash",
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
        expect(url).toContain("/models/gemini-2.5-flash:generateContent")
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
})
