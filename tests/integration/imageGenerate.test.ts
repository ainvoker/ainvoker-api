import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import request from "supertest"
import app from "../../src/app.js"
import { ensureBillingCatalog, getPlanByName, PLAN_NAMES } from "../../src/modules/billing/catalog.js"
import { ensureImageCatalog, imageCatalogDefaults } from "../../src/modules/image/catalog.js"
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

    async function upgradeToPro() {
        await ensureBillingCatalog()
        const pro = await getPlanByName(PLAN_NAMES.pro)
        await prismaClient.subscription.updateMany({
            where: { organizationId, status: "ACTIVE" },
            data: { status: "CANCELED" },
        })
        await prismaClient.subscription.create({
            data: { organizationId, planId: pro.id, status: "ACTIVE", startedAt: new Date() },
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
        await upgradeToPro()
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

    it("generates an image on Pro and writes an IMAGE AIRequest", async () => {
        await upgradeToPro()
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
        // 12 * $5/M + 1000 * $30/M
        expect(stored.requestCost?.toString()).toBe("0.03006")
        expect(JSON.stringify(stored.responsePayload)).not.toContain("aGVsbG8=")
    })

    it("returns 403 MODEL_DISABLED when the project disables the model", async () => {
        await upgradeToPro()
        await ensureImageCatalog()
        const model = await prismaClient.aIModel.findFirstOrThrow({
            where: { name: imageCatalogDefaults.modelName },
        })
        await prismaClient.projectModelAllow.create({
            data: { projectId, modelId: model.id, enabled: false },
        })

        const res = await generate({ model: imageCatalogDefaults.modelSlug, prompt: "A puppy" })
        expect(res.status).toBe(403)
        expect(res.body.error.code).toBe("MODEL_DISABLED")
        expect(fetchSpy).not.toHaveBeenCalled()
    })

    it("returns 429 when the image token hold does not fit the monthly budget", async () => {
        await upgradeToPro()
        const pro = await getPlanByName(PLAN_NAMES.pro)
        await prismaClient.plan.update({
            where: { id: pro.id },
            data: { tokenLimit: IMAGE_OUTPUT_TOKEN_HOLD },
        })

        try {
            const res = await generate({ model: imageCatalogDefaults.modelSlug, prompt: "A puppy" })
            expect(res.status).toBe(429)
            expect(res.body.error.code).toBe("RATE_LIMIT_EXCEEDED")
            expect(fetchSpy).not.toHaveBeenCalled()
        } finally {
            await prismaClient.plan.update({
                where: { id: pro.id },
                data: { tokenLimit: pro.tokenLimit },
            })
        }
    })

    it("marks the request FAILED when the provider errors", async () => {
        await upgradeToPro()
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
