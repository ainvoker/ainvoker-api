import http from "node:http"
import type { AddressInfo } from "node:net"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import request from "supertest"
import app from "../../src/app.js"
import { getPlanByName, PLAN_NAMES } from "../../src/modules/billing/catalog.js"
import { ensureTextCatalog, textCatalogDefaults } from "../../src/modules/text/catalog.js"
import apiKeyHasher from "../../src/platform/hash.js"
import prismaClient from "../../src/platform/prisma.js"
import { cleanupTestUser, seedUserWithPersonalOrg, testUserId } from "../helpers/db.js"
import "../../src/providers/index.js"

function openaiUpstreamSse(contentChunks: string[], usage = true): string {
    const lines = contentChunks.map(
        (content) => `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`,
    )
    if (usage) {
        lines.push(
            `data: ${JSON.stringify({
                choices: [],
                usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
            })}\n\n`,
        )
    }
    lines.push("data: [DONE]\n\n")
    return lines.join("")
}

function geminiUpstreamSse(contentChunks: string[]): string {
    const lines = contentChunks.map(
        (text, index) =>
            `data: ${JSON.stringify({
                candidates: [{ content: { role: "model", parts: [{ text }] } }],
                ...(index === contentChunks.length - 1
                    ? {
                          usageMetadata: {
                              promptTokenCount: 8,
                              candidatesTokenCount: 4,
                              totalTokenCount: 12,
                          },
                      }
                    : {}),
            })}\n\n`,
    )
    return lines.join("")
}

function parseSseEvents(body: string): Array<{ event: string; data: unknown }> {
    const events: Array<{ event: string; data: unknown }> = []
    const blocks = body.replace(/\r\n/g, "\n").split("\n\n")
    for (const block of blocks) {
        if (!block.trim()) continue
        let event = "message"
        const dataLines: string[] = []
        for (const line of block.split("\n")) {
            if (line.startsWith("event:")) {
                event = line.slice(6).trimStart()
            } else if (line.startsWith("data:")) {
                dataLines.push(line.slice(5).replace(/^ /, ""))
            }
        }
        if (dataLines.length === 0) continue
        events.push({ event, data: JSON.parse(dataLines.join("\n")) })
    }
    return events
}

function sseFetchResponse(payload: string): Response {
    return new Response(payload, {
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
    })
}

describe("POST /v1/text/stream", () => {
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
                name: `Stream Project ${userId.slice(-8)}`,
                environment: "DEVELOPMENT",
            },
        })
        projectId = project.id

        const generated = apiKeyHasher.generate()
        plaintextKey = generated.plaintext
        await prismaClient.apiKey.create({
            data: {
                projectId,
                keyName: "Stream Test Key",
                keyHash: generated.keyHash,
                keyPrefix: generated.keyPrefix,
                status: "ACTIVE",
            },
        })

        fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
            const url = String(input)
            if (url.includes(":streamGenerateContent")) {
                return sseFetchResponse(geminiUpstreamSse(["Hello from ", "Gemini mock"]))
            }
            if (url.includes(":generateContent")) {
                return new Response(
                    JSON.stringify({
                        candidates: [
                            {
                                content: {
                                    role: "model",
                                    parts: [{ text: "non-stream" }],
                                },
                            },
                        ],
                    }),
                    { status: 200, headers: { "Content-Type": "application/json" } },
                )
            }

            const body = typeof init?.body === "string" ? JSON.parse(init.body) : {}
            expect(body.stream).toBe(true)
            return sseFetchResponse(openaiUpstreamSse(["Hello from ", "mock"]))
        })
    })

    afterEach(async () => {
        fetchSpy?.mockRestore()
        if (userId) {
            await cleanupTestUser(userId)
        }
    })

    it("streams OpenAI meta → delta → done and writes SUCCESS", async () => {
        const res = await request(app.express)
            .post("/v1/text/stream")
            .set({ Authorization: `Bearer ${plaintextKey}` })
            .send({
                model: textCatalogDefaults.modelSlug,
                messages: [{ role: "user", content: "Say hello" }],
            })

        expect(res.status).toBe(200)
        expect(res.headers["content-type"]).toMatch(/text\/event-stream/)
        expect(res.headers["x-ratelimit-limit-requests"]).toBeDefined()

        const events = parseSseEvents(res.text)
        expect(events.map((e) => e.event)).toEqual(["meta", "delta", "delta", "done"])
        expect(events[0]?.data).toMatchObject({ model: textCatalogDefaults.modelSlug })
        expect(events[1]?.data).toEqual({ content: "Hello from " })
        expect(events[2]?.data).toEqual({ content: "mock" })
        expect(events[3]?.data).toMatchObject({
            message: { role: "assistant", content: "Hello from mock" },
            usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
        })

        const id = (events[0]?.data as { id: string }).id
        const row = await prismaClient.aIRequest.findUniqueOrThrow({ where: { id } })
        expect(row.requestStatus).toBe("SUCCESS")
        expect(row.inputTokens).toBe(10)
        expect(row.outputTokens).toBe(5)
        expect(row.totalTokens).toBe(15)

        const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit]
        expect(JSON.parse(String(init.body)).stream).toBe(true)
        expect(JSON.parse(String(init.body)).stream_options).toEqual({ include_usage: true })
    })

    it("streams Gemini and asserts alt=sse URL", async () => {
        const res = await request(app.express)
            .post("/v1/text/stream")
            .set({ Authorization: `Bearer ${plaintextKey}` })
            .send({
                model: textCatalogDefaults.geminiModelSlug,
                messages: [{ role: "user", content: "Say hello" }],
            })

        expect(res.status).toBe(200)
        const events = parseSseEvents(res.text)
        expect(events.map((e) => e.event)).toEqual(["meta", "delta", "delta", "done"])
        expect(events[3]?.data).toMatchObject({
            message: { role: "assistant", content: "Hello from Gemini mock" },
            usage: { inputTokens: 8, outputTokens: 4, totalTokens: 12 },
        })

        const [url] = fetchSpy.mock.calls[0] as [string, RequestInit]
        expect(url).toContain(":streamGenerateContent")
        expect(url).toContain("alt=sse")

        const id = (events[0]?.data as { id: string }).id
        const row = await prismaClient.aIRequest.findUniqueOrThrow({ where: { id } })
        expect(row.requestStatus).toBe("SUCCESS")
        expect(row.totalTokens).toBe(12)
    })

    it("forwards reasoning to Gemini thinkingConfig and bills thinking tokens as output", async () => {
        fetchSpy.mockImplementation(async () =>
            sseFetchResponse(
                `data: ${JSON.stringify({
                    candidates: [{ content: { role: "model", parts: [{ text: "Hi" }] } }],
                    usageMetadata: {
                        promptTokenCount: 5,
                        candidatesTokenCount: 10,
                        thoughtsTokenCount: 80,
                        totalTokenCount: 95,
                    },
                })}\n\n`,
            ),
        )

        const res = await request(app.express)
            .post("/v1/text/stream")
            .set({ Authorization: `Bearer ${plaintextKey}` })
            .send({
                model: textCatalogDefaults.geminiModelSlug,
                messages: [{ role: "user", content: "Hi" }],
                reasoning: "minimal",
            })

        expect(res.status).toBe(200)
        const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit]
        expect(JSON.parse(String(init.body)).generationConfig.thinkingConfig).toEqual({
            thinkingLevel: "minimal",
        })

        const events = parseSseEvents(res.text)
        expect(events.at(-1)?.data).toMatchObject({
            usage: { inputTokens: 5, outputTokens: 90, totalTokens: 95 },
        })

        const id = (events[0]?.data as { id: string }).id
        const row = await prismaClient.aIRequest.findUniqueOrThrow({ where: { id } })
        expect(row.outputTokens).toBe(90)
        expect(row.requestPayload).toMatchObject({ reasoning: "minimal" })
    })

    it("does not send reasoning to OpenAI non-thinking models", async () => {
        const res = await request(app.express)
            .post("/v1/text/stream")
            .set({ Authorization: `Bearer ${plaintextKey}` })
            .send({
                model: textCatalogDefaults.modelSlug,
                messages: [{ role: "user", content: "Hi" }],
                reasoning: "low",
            })

        expect(res.status).toBe(200)
        const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit]
        const body = JSON.parse(String(init.body))
        expect(body).not.toHaveProperty("reasoning")
        expect(body).not.toHaveProperty("reasoning_effort")
    })

    it("streams gemini-3.5-flash-lite by bare name", async () => {
        const res = await request(app.express)
            .post("/v1/text/stream")
            .set({ Authorization: `Bearer ${plaintextKey}` })
            .send({
                model: "gemini-3.5-flash-lite",
                messages: [{ role: "user", content: "Hi" }],
            })

        expect(res.status).toBe(200)
        const events = parseSseEvents(res.text)
        expect(events[0]?.data).toMatchObject({ model: textCatalogDefaults.geminiLiteModelSlug })
        expect(events.at(-1)?.event).toBe("done")

        const [url] = fetchSpy.mock.calls[0] as [string, RequestInit]
        expect(url).toContain("/models/gemini-3.5-flash-lite:streamGenerateContent")
    })

    it("resolves a unique bare model name", async () => {
        const res = await request(app.express)
            .post("/v1/text/stream")
            .set({ Authorization: `Bearer ${plaintextKey}` })
            .send({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: "Hi" }],
            })

        expect(res.status).toBe(200)
        const events = parseSseEvents(res.text)
        expect(events[0]?.data).toMatchObject({ model: textCatalogDefaults.modelSlug })
    })

    it("returns 404 JSON for an unknown model before SSE", async () => {
        const res = await request(app.express)
            .post("/v1/text/stream")
            .set({ Authorization: `Bearer ${plaintextKey}` })
            .send({
                model: "not-a-real-model",
                messages: [{ role: "user", content: "Hi" }],
            })

        expect(res.status).toBe(404)
        expect(res.headers["content-type"]).toMatch(/application\/json/)
        expect(res.body.error.code).toBe("NOT_FOUND")
        expect(fetchSpy).not.toHaveBeenCalled()
    })

    it("returns 400 JSON for an invalid body before SSE", async () => {
        const res = await request(app.express)
            .post("/v1/text/stream")
            .set({ Authorization: `Bearer ${plaintextKey}` })
            .send({
                model: "openai/gpt-4o-mini",
                messages: [],
            })

        expect(res.status).toBe(400)
        expect(res.body.error.code).toBe("VALIDATION_ERROR")
        expect(fetchSpy).not.toHaveBeenCalled()
    })

    it("returns 403 MODEL_NOT_ALLOWED_ON_PLAN for Free + non-eligible", async () => {
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
            .post("/v1/text/stream")
            .set({ Authorization: `Bearer ${plaintextKey}` })
            .send({
                model: "openai/gpt-4o",
                messages: [{ role: "user", content: "Hi" }],
            })

        expect(res.status).toBe(403)
        expect(res.body.error.code).toBe("MODEL_NOT_ALLOWED_ON_PLAN")
        expect(fetchSpy).not.toHaveBeenCalled()
    })

    it("returns 403 MODEL_DISABLED when the project allowlist disables the model", async () => {
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
            .post("/v1/text/stream")
            .set({ Authorization: `Bearer ${plaintextKey}` })
            .send({
                model: textCatalogDefaults.modelSlug,
                messages: [{ role: "user", content: "Hi" }],
            })

        expect(res.status).toBe(403)
        expect(res.body.error.code).toBe("MODEL_DISABLED")
        expect(fetchSpy).not.toHaveBeenCalled()
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
        const apiKey = await prismaClient.apiKey.findFirstOrThrow({ where: { projectId } })

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
                .post("/v1/text/stream")
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

    it("does not exceed monthly request limit under concurrent streams", async () => {
        await ensureTextCatalog()
        const openai = await prismaClient.aIProvider.findUniqueOrThrow({
            where: { name: "openai" },
        })
        const model = await prismaClient.aIModel.findUniqueOrThrow({
            where: {
                providerId_name: { providerId: openai.id, name: "gpt-4o-mini" },
            },
        })
        const apiKey = await prismaClient.apiKey.findFirstOrThrow({ where: { projectId } })

        const requestLimit = 3
        const free = await getPlanByName(PLAN_NAMES.free)
        await prismaClient.plan.update({
            where: { id: free.id },
            data: { requestLimit },
        })

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
            const results = await Promise.all(
                Array.from({ length: 4 }, () =>
                    request(app.express)
                        .post("/v1/text/stream")
                        .set({ Authorization: `Bearer ${plaintextKey}` })
                        .send({
                            model: textCatalogDefaults.modelSlug,
                            messages: [{ role: "user", content: "Hi" }],
                        }),
                ),
            )

            const successes = results.filter((r) => r.status === 200)
            const limited = results.filter((r) => r.status === 429)
            expect(successes).toHaveLength(1)
            expect(limited).toHaveLength(3)
            expect(fetchSpy).toHaveBeenCalledTimes(1)

            const total = await prismaClient.aIRequest.count({
                where: {
                    projectId,
                    requestStatus: { in: ["PENDING", "SUCCESS", "FAILED"] },
                },
            })
            expect(total).toBe(requestLimit)
        } finally {
            await prismaClient.plan.update({
                where: { id: free.id },
                data: { requestLimit: 300 },
            })
        }
    })

    it("marks FAILED and releases token hold when the client disconnects", async () => {
        let releaseSecond: (() => void) | undefined
        const gate = new Promise<void>((resolve) => {
            releaseSecond = resolve
        })

        fetchSpy.mockImplementation(async (_input, init) => {
            const signal = init?.signal
            const stream = new ReadableStream<Uint8Array>({
                async start(controller) {
                    const encoder = new TextEncoder()
                    controller.enqueue(
                        encoder.encode(
                            `data: ${JSON.stringify({ choices: [{ delta: { content: "Hi" } }] })}\n\n`,
                        ),
                    )
                    await Promise.race([
                        gate,
                        signal
                            ? new Promise<void>((resolve) => {
                                  if (signal.aborted) {
                                      resolve()
                                      return
                                  }
                                  signal.addEventListener("abort", () => resolve(), { once: true })
                              })
                            : new Promise<void>(() => undefined),
                    ])
                    if (signal?.aborted) {
                        try {
                            controller.error(new DOMException("Aborted", "AbortError"))
                        } catch {
                            /* already closed */
                        }
                        return
                    }
                    try {
                        controller.enqueue(
                            encoder.encode(
                                `data: ${JSON.stringify({ choices: [{ delta: { content: " there" } }] })}\n\n`,
                            ),
                        )
                        controller.enqueue(encoder.encode("data: [DONE]\n\n"))
                        controller.close()
                    } catch {
                        // aborted
                    }
                },
            })
            return new Response(stream, {
                status: 200,
                headers: { "Content-Type": "text/event-stream" },
            })
        })

        const server = http.createServer(app.express)
        await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve))
        const { port } = server.address() as AddressInfo

        try {
            const requestId = await new Promise<string>((resolve, reject) => {
                const req = http.request(
                    {
                        hostname: "127.0.0.1",
                        port,
                        path: "/v1/text/stream",
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${plaintextKey}`,
                            "Content-Type": "application/json",
                            Connection: "keep-alive",
                        },
                    },
                    (res) => {
                        let buffer = ""
                        res.on("data", (chunk: Buffer) => {
                            buffer += chunk.toString("utf8")
                            if (buffer.includes("event: meta") && buffer.includes("event: delta")) {
                                const match = /"id":"([^"]+)"/.exec(buffer)
                                if (!match) {
                                    reject(new Error("missing request id in meta"))
                                    return
                                }
                                req.destroy()
                                resolve(match[1]!)
                            }
                        })
                        res.on("error", () => {
                            /* connection destroyed */
                        })
                    },
                )
                req.on("error", () => {
                    /* expected after destroy */
                })
                req.write(
                    JSON.stringify({
                        model: textCatalogDefaults.modelSlug,
                        messages: [{ role: "user", content: "Hi" }],
                    }),
                )
                req.end()
            })

            let row = await prismaClient.aIRequest.findUniqueOrThrow({
                where: { id: requestId },
            })
            for (let i = 0; i < 50 && row.requestStatus === "PENDING"; i++) {
                await new Promise((r) => setTimeout(r, 100))
                row = await prismaClient.aIRequest.findUniqueOrThrow({
                    where: { id: requestId },
                })
            }

            expect(row.requestStatus).toBe("FAILED")
            expect(row.inputTokens).toBeNull()
            expect(row.outputTokens).toBeNull()
            expect(row.totalTokens).toBeNull()
        } finally {
            releaseSecond?.()
            await new Promise<void>((resolve, reject) =>
                server.close((err) => (err ? reject(err) : resolve())),
            )
        }
    })

    describe("tool calling", () => {
        const weatherTool = {
            name: "get_weather",
            parameters: {
                type: "object",
                properties: { city: { type: "string" } },
            },
        }

        function openaiChunk(delta: Record<string, unknown>, finishReason: string | null = null) {
            return `data: ${JSON.stringify({ choices: [{ delta, finish_reason: finishReason }] })}\n\n`
        }

        it("emits tool_call before done with matching done.message.toolCalls", async () => {
            const upstream = [
                openaiChunk({ content: "Checking " }),
                openaiChunk({
                    tool_calls: [
                        {
                            index: 0,
                            id: "call_a",
                            type: "function",
                            function: { name: "get_weather", arguments: '{"ci' },
                        },
                    ],
                }),
                openaiChunk({ tool_calls: [{ index: 0, function: { arguments: 'ty":"Manila"}' } }] }),
                openaiChunk({
                    tool_calls: [
                        {
                            index: 1,
                            id: "call_b",
                            type: "function",
                            function: { name: "get_weather", arguments: '{"city":"Cebu"}' },
                        },
                    ],
                }),
                openaiChunk({}, "tool_calls"),
                `data: ${JSON.stringify({
                    choices: [],
                    usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
                })}\n\n`,
                "data: [DONE]\n\n",
            ].join("")
            fetchSpy.mockImplementation(async () => sseFetchResponse(upstream))

            const res = await request(app.express)
                .post("/v1/text/stream")
                .set({ Authorization: `Bearer ${plaintextKey}` })
                .send({
                    model: textCatalogDefaults.modelSlug,
                    messages: [{ role: "user", content: "Weather in Manila and Cebu?" }],
                    tools: [weatherTool],
                })

            expect(res.status).toBe(200)
            const events = parseSseEvents(res.text)
            expect(events.map((e) => e.event)).toEqual([
                "meta",
                "delta",
                "tool_call",
                "tool_call",
                "done",
            ])
            const expectedCalls = [
                { id: "call_a", name: "get_weather", arguments: { city: "Manila" } },
                { id: "call_b", name: "get_weather", arguments: { city: "Cebu" } },
            ]
            expect(events[2]?.data).toEqual(expectedCalls[0])
            expect(events[3]?.data).toEqual(expectedCalls[1])
            expect(events[4]?.data).toMatchObject({
                message: { role: "assistant", content: "Checking ", toolCalls: expectedCalls },
                usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
            })

            const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit]
            const body = JSON.parse(String(init.body))
            expect(body.stream_options).toEqual({ include_usage: true })
            expect(body.tools).toEqual([
                { type: "function", function: { name: "get_weather", parameters: weatherTool.parameters } },
            ])

            const id = (events[0]?.data as { id: string }).id
            const row = await prismaClient.aIRequest.findUniqueOrThrow({ where: { id } })
            expect(row.requestStatus).toBe("SUCCESS")
            expect(row.responsePayload).toMatchObject({ message: { toolCalls: expectedCalls } })
        })

        it("treats a tool-only stream as SUCCESS with empty content", async () => {
            const upstream = [
                openaiChunk({
                    content: null,
                    tool_calls: [
                        {
                            index: 0,
                            id: "call_a",
                            type: "function",
                            function: { name: "get_weather", arguments: '{"city":"Manila"}' },
                        },
                    ],
                }),
                openaiChunk({}, "tool_calls"),
                "data: [DONE]\n\n",
            ].join("")
            fetchSpy.mockImplementation(async () => sseFetchResponse(upstream))

            const res = await request(app.express)
                .post("/v1/text/stream")
                .set({ Authorization: `Bearer ${plaintextKey}` })
                .send({
                    model: textCatalogDefaults.modelSlug,
                    messages: [{ role: "user", content: "Weather in Manila?" }],
                    tools: [weatherTool],
                })

            const events = parseSseEvents(res.text)
            expect(events.map((e) => e.event)).toEqual(["meta", "tool_call", "done"])
            expect(events[2]?.data).toMatchObject({
                message: {
                    role: "assistant",
                    content: "",
                    toolCalls: [{ id: "call_a", name: "get_weather", arguments: { city: "Manila" } }],
                },
            })

            const id = (events[0]?.data as { id: string }).id
            const row = await prismaClient.aIRequest.findUniqueOrThrow({ where: { id } })
            expect(row.requestStatus).toBe("SUCCESS")
        })

        it("streams a Gemini function call with a generated id and its thought signature", async () => {
            fetchSpy.mockImplementation(async () =>
                sseFetchResponse(
                    `data: ${JSON.stringify({
                        candidates: [
                            {
                                content: {
                                    role: "model",
                                    parts: [
                                        {
                                            functionCall: { name: "get_weather", args: { city: "Manila" } },
                                            thoughtSignature: "sig-abc",
                                        },
                                    ],
                                },
                            },
                        ],
                        usageMetadata: { promptTokenCount: 8, candidatesTokenCount: 4, totalTokenCount: 12 },
                    })}\n\n`,
                ),
            )

            const res = await request(app.express)
                .post("/v1/text/stream")
                .set({ Authorization: `Bearer ${plaintextKey}` })
                .send({
                    model: textCatalogDefaults.geminiModelSlug,
                    messages: [{ role: "user", content: "Weather in Manila?" }],
                    tools: [weatherTool],
                })

            const events = parseSseEvents(res.text)
            expect(events.map((e) => e.event)).toEqual(["meta", "tool_call", "done"])
            expect(events[1]?.data).toEqual({
                id: "call_0",
                name: "get_weather",
                arguments: { city: "Manila" },
                providerMetadata: { gemini: { thoughtSignature: "sig-abc" } },
            })
            expect(events[2]?.data).toMatchObject({
                message: { content: "", toolCalls: [events[1]?.data] },
            })
        })

        it("keeps the text-only done shape when no tools are sent", async () => {
            const res = await request(app.express)
                .post("/v1/text/stream")
                .set({ Authorization: `Bearer ${plaintextKey}` })
                .send({
                    model: textCatalogDefaults.modelSlug,
                    messages: [{ role: "user", content: "Say hello" }],
                })

            const events = parseSseEvents(res.text)
            const done = events.find((e) => e.event === "done")?.data as {
                message: Record<string, unknown>
            }
            expect(done.message).toEqual({ role: "assistant", content: "Hello from mock" })
            const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit]
            expect(JSON.parse(String(init.body))).not.toHaveProperty("tools")
        })
    })
})
