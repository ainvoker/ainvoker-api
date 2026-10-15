import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import request from "supertest"
import app from "../../src/app.js"
import { ensureBillingCatalog, getPlanByName, PLAN_NAMES } from "../../src/modules/billing/catalog.js"
import { imageCatalogDefaults } from "../../src/modules/catalog/seed.js"
import { IMAGE_OUTPUT_TOKEN_HOLD } from "../../src/modules/image/service.js"
import apiKeyHasher from "../../src/platform/hash.js"
import prismaClient from "../../src/platform/prisma.js"
import { cleanupTestUser, seedUserWithPersonalOrg, testUserId } from "../helpers/db.js"
import "../../src/providers/index.js"

describe("POST /v1/image/generate", () => {
    let userId: string
    let organizationId: string
    let projectId: string
    let plaintextKey: string
    let fetchSpy: ReturnType<typeof vi.spyOn>

    async function subscribeTo(planName: typeof PLAN_NAMES.pro | typeof PLAN_NAMES.scale) {
        await ensureBillingCatalog()
        const plan = await getPlanByName(planName)
        await prismaClient.subscription.updateMany({
            where: { organizationId, status: "ACTIVE" },
            data: { status: "CANCELED" },
        })
        await prismaClient.subscription.create({
            data: { organizationId, planId: plan.id, status: "ACTIVE", startedAt: new Date() },
        })
    }

    const upgradeToScale = () => subscribeTo(PLAN_NAMES.scale)

    /** Image models are premium, so projects start with them disabled. */
    async function enableImageModels() {
        const models = await prismaClient.aIModel.findMany({ where: { type: "IMAGE" } })
        await prismaClient.projectModelAllow.createMany({
            data: models.map((model) => ({ projectId, modelId: model.id, enabled: true })),
            skipDuplicates: true,
        })
    }

    function generate(body: Record<string, unknown>) {
        return request(app.express)
            .post("/v1/image/generate")
            .set({ Authorization: `Bearer ${plaintextKey}` })
            .send(body)
    }

    beforeEach(async () => {
        userId = testUserId()
        const seeded = await seedUserWithPersonalOrg(userId)
        organizationId = seeded.organizationId

        const project = await prismaClient.project.create({
            data: {
                organizationId,
                name: `Image Project ${userId.slice(-8)}`,
                environment: "DEVELOPMENT",
            },
        })
        projectId = project.id
        await enableImageModels()

        const generated = apiKeyHasher.generate()
        plaintextKey = generated.plaintext
        await prismaClient.apiKey.create({
            data: {
                projectId,
                keyName: "Image Test Key",
                keyHash: generated.keyHash,
                keyPrefix: generated.keyPrefix,
                status: "ACTIVE",
            },
        })

        fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
            new Response(
                JSON.stringify({
                    created: 1,
                    data: [{ b64_json: "aGVsbG8=", revised_prompt: "A puppy" }],
                    output_format: "png",
                    usage: { input_tokens: 12, output_tokens: 1000, total_tokens: 1012 },
                }),
                { status: 200, headers: { "Content-Type": "application/json" } },
            ),
        )
    })

    afterEach(async () => {
        fetchSpy?.mockRestore()
        if (userId) {
            await cleanupTestUser(userId)
        }
    })

    it("returns 401 without Authorization", async () => {
        const res = await request(app.express).post("/v1/image/generate").send({
            model: imageCatalogDefaults.modelSlug,
            prompt: "A puppy",
        })
        expect(res.status).toBe(401)
    })

    it("rejects an empty prompt", async () => {
        const res = await generate({ model: imageCatalogDefaults.modelSlug, prompt: "" })
        expect(res.status).toBe(400)
        expect(res.body.error.code).toBe("VALIDATION_ERROR")
    })

    it("returns 404 for a text model", async () => {
        await upgradeToScale()
        const res = await generate({ model: "openai/gpt-4o-mini", prompt: "A puppy" })
        expect(res.status).toBe(404)
        expect(fetchSpy).not.toHaveBeenCalled()
    })

    it("returns 403 MODEL_NOT_ALLOWED_ON_PLAN on Free", async () => {
        const res = await generate({ model: imageCatalogDefaults.modelSlug, prompt: "A puppy" })
        expect(res.status).toBe(403)
        expect(res.body.error.code).toBe("MODEL_NOT_ALLOWED_ON_PLAN")
        expect(fetchSpy).not.toHaveBeenCalled()
    })

    it("generates an image on Pro", async () => {
        await subscribeTo(PLAN_NAMES.pro)
        const res = await generate({ model: imageCatalogDefaults.modelSlug, prompt: "A puppy" })
        expect(res.status).toBe(200)
        expect(res.body.data.images).toHaveLength(1)
        expect(fetchSpy).toHaveBeenCalledTimes(1)
    })

    it("generates an image on Scale and writes an IMAGE AIRequest", async () => {
        await upgradeToScale()
        const res = await generate({
            model: imageCatalogDefaults.modelSlug,
            prompt: "A puppy",
            size: "1024x1024",
            quality: "low",
        })

        expect(res.status).toBe(200)
        expect(res.body.data).toMatchObject({
            model: imageCatalogDefaults.modelSlug,
            images: [{ base64: "aGVsbG8=", mimeType: "image/png", revisedPrompt: "A puppy" }],
            usage: { inputTokens: 12, outputTokens: 1000, totalTokens: 1012 },
        })

        const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit]
        expect(url).toContain("/images/generations")
        expect(JSON.parse(String(init.body))).toEqual({
            model: imageCatalogDefaults.modelName,
            prompt: "A puppy",
            n: 1,
            size: "1024x1024",
            quality: "low",
        })

        const stored = await prismaClient.aIRequest.findUniqueOrThrow({
            where: { id: res.body.data.id as string },
        })
        expect(stored.serviceType).toBe("IMAGE")
        expect(stored.requestStatus).toBe("SUCCESS")
        expect(stored.totalTokens).toBe(1012)
        // Retail = provider × image markup (1.4): 12 * $7/M + 1000 * $42/M
        expect(stored.requestCost?.toString()).toBe("0.042084")
        expect(JSON.stringify(stored.responsePayload)).not.toContain("aGVsbG8=")
    })

    it("generates Gemini images through the Interactions API, one call per image", async () => {
        await upgradeToScale()
        fetchSpy.mockImplementation(async () =>
            new Response(
                JSON.stringify({
                    id: "v1_abc",
                    status: "completed",
                    usage: { total_input_tokens: 10, total_output_tokens: 1120, total_tokens: 1130 },
                    steps: [
                        {
                            type: "model_output",
                            content: [
                                { type: "text", text: "Here you go" },
                                { type: "image", mime_type: "image/png", data: "Z2VtaW5p" },
                            ],
                        },
                    ],
                }),
                { status: 200, headers: { "Content-Type": "application/json" } },
            ),
        )

        const res = await generate({
            model: "gemini/gemini-nano-banana-2.1",
            prompt: "A puppy",
            n: 2,
        })

        expect(res.status).toBe(200)
        expect(res.body.data).toMatchObject({
            model: "gemini/gemini-nano-banana-2.1",
            images: [
                { base64: "Z2VtaW5p", mimeType: "image/png" },
                { base64: "Z2VtaW5p", mimeType: "image/png" },
            ],
            usage: { inputTokens: 20, outputTokens: 2240, totalTokens: 2260 },
        })

        expect(fetchSpy).toHaveBeenCalledTimes(2)
        const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit]
        expect(url).toMatch(/\/v1beta\/interactions$/)
        expect((init.headers as Record<string, string>)["x-goog-api-key"]).toBeTruthy()
        expect(JSON.parse(String(init.body))).toEqual({
            model: "gemini-nano-banana-2.1",
            input: "A puppy",
            store: false,
        })

        const stored = await prismaClient.aIRequest.findUniqueOrThrow({
            where: { id: res.body.data.id as string },
        })
        expect(stored.requestStatus).toBe("SUCCESS")
        expect(JSON.stringify(stored.responsePayload)).not.toContain("Z2VtaW5p")
    })

    it("returns 502 when Gemini responds without an image", async () => {
        await upgradeToScale()
        fetchSpy.mockImplementation(async () =>
            new Response(
                JSON.stringify({
                    status: "completed",
                    steps: [{ type: "model_output", content: [{ type: "text", text: "No." }] }],
                }),
                { status: 200, headers: { "Content-Type": "application/json" } },
            ),
        )

        const res = await generate({ model: "gemini/gemini-nano-banana-2.1", prompt: "A puppy" })
        expect(res.status).toBe(502)
        expect(res.body.error.code).toBe("UPSTREAM_ERROR")
    })

    it("returns 403 MODEL_DISABLED when the project disables the model", async () => {
        await upgradeToScale()
        const model = await prismaClient.aIModel.findFirstOrThrow({
            where: { name: imageCatalogDefaults.modelName },
        })
        await prismaClient.projectModelAllow.update({
            where: { projectId_modelId: { projectId, modelId: model.id } },
            data: { enabled: false },
        })

        const res = await generate({ model: imageCatalogDefaults.modelSlug, prompt: "A puppy" })
        expect(res.status).toBe(403)
        expect(res.body.error.code).toBe("MODEL_DISABLED")
        expect(fetchSpy).not.toHaveBeenCalled()
    })

    it("returns 429 when the image token hold does not fit the Scale safety ceiling", async () => {
        await upgradeToScale()
        const scale = await getPlanByName(PLAN_NAMES.scale)
        await prismaClient.plan.update({
            where: { id: scale.id },
            data: { tokenLimit: IMAGE_OUTPUT_TOKEN_HOLD },
        })

        try {
            const res = await generate({ model: imageCatalogDefaults.modelSlug, prompt: "A puppy" })
            expect(res.status).toBe(429)
            expect(res.body.error.code).toBe("RATE_LIMIT_EXCEEDED")
            expect(fetchSpy).not.toHaveBeenCalled()
        } finally {
            await prismaClient.plan.update({
                where: { id: scale.id },
                data: { tokenLimit: scale.tokenLimit },
            })
        }
    })

    it("marks the request FAILED when the provider errors", async () => {
        await upgradeToScale()
        fetchSpy.mockImplementation(async () =>
            new Response(JSON.stringify({ error: { message: "Prompt rejected" } }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            }),
        )

        const res = await generate({ model: imageCatalogDefaults.modelSlug, prompt: "A puppy" })
        expect(res.status).toBe(400)
        expect(res.body.error.code).toBe("UPSTREAM_ERROR")

        const stored = await prismaClient.aIRequest.findFirstOrThrow({
            where: { projectId, serviceType: "IMAGE" },
        })
        expect(stored.requestStatus).toBe("FAILED")
        expect(stored.totalTokens).toBeNull()
    })
})
