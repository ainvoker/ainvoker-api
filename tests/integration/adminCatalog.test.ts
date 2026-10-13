import { randomUUID } from "node:crypto"
import request from "supertest"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import app from "../../src/app.js"
import env from "../../src/config/env.js"
import prismaClient from "../../src/platform/prisma.js"
import { useTestAuthUser } from "../helpers/fixtures.js"

describe("admin catalog endpoints", () => {
    const authUser = useTestAuthUser()
    const createdModelIds: number[] = []
    const createdProviderIds: number[] = []

    beforeEach(() => {
        vi.spyOn(env, "isPlatformAdmin").mockImplementation(
            (userId) => userId === authUser.auth.userId,
        )
    })

    afterEach(async () => {
        vi.restoreAllMocks()
        await prismaClient.projectModelAllow.deleteMany({
            where: { modelId: { in: createdModelIds } },
        })
        await prismaClient.aIModel.deleteMany({ where: { id: { in: createdModelIds } } })
        await prismaClient.aIProvider.deleteMany({ where: { id: { in: createdProviderIds } } })
        createdModelIds.length = 0
        createdProviderIds.length = 0
    })

    async function openaiProviderId() {
        const provider = await prismaClient.aIProvider.findUniqueOrThrow({ where: { name: "openai" } })
        return provider.id
    }

    async function createModel(body: Record<string, unknown>) {
        const res = await request(app.express)
            .post("/api/v1/admin/models")
            .set(authUser.headers())
            .send(body)
        if (res.status === 201) {
            createdModelIds.push(res.body.data.id as number)
        }
        return res
    }

    function uniqueName() {
        return `vitest-model-${randomUUID().slice(0, 8)}`
    }

    it("returns 401 without Authorization", async () => {
        const res = await request(app.express).get("/api/v1/admin/models")
        expect(res.status).toBe(401)
    })

    it("returns 403 for users who are not platform admins", async () => {
        vi.spyOn(env, "isPlatformAdmin").mockReturnValue(false)
        const res = await request(app.express).get("/api/v1/admin/models").set(authUser.headers())
        expect(res.status).toBe(403)
        expect(res.body.error.code).toBe("FORBIDDEN")
    })

    it("lists providers with adapter flags", async () => {
        const res = await request(app.express).get("/api/v1/admin/providers").set(authUser.headers())
        expect(res.status).toBe(200)
        const openai = (res.body.data as Array<{ name: string }>).find((p) => p.name === "openai")
        expect(openai).toMatchObject({ hasTextAdapter: true, hasImageAdapter: true })
    })

    it("creates a model that routes and appears in new projects", async () => {
        const name = uniqueName()
        const res = await createModel({
            providerId: await openaiProviderId(),
            name,
            type: "TEXT",
            contextWindow: 128000,
            inputPrice: 0.15,
            outputPrice: 0.6,
            freeEligible: true,
        })

        expect(res.status).toBe(201)
        expect(res.body.data).toMatchObject({
            slug: `openai/${name}`,
            status: "ACTIVE",
            freeEligible: true,
            routable: true,
            inputPrice: "0.15",
        })

        const projectRes = await request(app.express)
            .post(`/api/v1/organizations/${authUser.auth.organizationId}/projects`)
            .set(authUser.headers())
            .send({ name: `Admin Catalog ${name}`, environment: "DEVELOPMENT" })
        expect(projectRes.status).toBe(201)

        const listRes = await request(app.express)
            .get(`/api/v1/projects/${projectRes.body.data.id}/models`)
            .set(authUser.headers())
        const row = (listRes.body.data as Array<{ slug: string; enabled: boolean }>).find(
            (item) => item.slug === `openai/${name}`,
        )
        expect(row).toMatchObject({ enabled: true })
    })

    it("rejects a duplicate provider/name", async () => {
        const providerId = await openaiProviderId()
        const body = {
            providerId,
            name: uniqueName(),
            type: "TEXT",
            contextWindow: 1000,
            inputPrice: 0,
            outputPrice: 0,
        }
        expect((await createModel(body)).status).toBe(201)

        const res = await createModel(body)
        expect(res.status).toBe(409)
        expect(res.body.error.code).toBe("CONFLICT")
    })

    it("rejects freeEligible image models", async () => {
        const res = await createModel({
            providerId: await openaiProviderId(),
            name: uniqueName(),
            type: "IMAGE",
            contextWindow: 32000,
            inputPrice: 5,
            outputPrice: 30,
            freeEligible: true,
        })
        expect(res.status).toBe(400)
        expect(res.body.error.code).toBe("VALIDATION_ERROR")
    })

    it("updates status and prices and filters by status", async () => {
        const name = uniqueName()
        const created = await createModel({
            providerId: await openaiProviderId(),
            name,
            type: "TEXT",
            contextWindow: 1000,
            inputPrice: 1,
            outputPrice: 2,
        })
        const modelId = created.body.data.id as number

        const res = await request(app.express)
            .patch(`/api/v1/admin/models/${modelId}`)
            .set(authUser.headers())
            .send({ status: "DEPRECATED", outputPrice: 3 })
        expect(res.status).toBe(200)
        expect(res.body.data).toMatchObject({ status: "DEPRECATED", outputPrice: "3" })

        const getRes = await request(app.express)
            .get(`/api/v1/admin/models/${modelId}`)
            .set(authUser.headers())
        expect(getRes.body.data.status).toBe("DEPRECATED")

        const filtered = await request(app.express)
            .get("/api/v1/admin/models?status=DEPRECATED")
            .set(authUser.headers())
        expect((filtered.body.data as Array<{ id: number }>).some((m) => m.id === modelId)).toBe(true)
    })

    it("lists non-routable models for admins but hides them from projects", async () => {
        const provider = await prismaClient.aIProvider.create({
            data: {
                name: `vitest-provider-${randomUUID().slice(0, 8)}`,
                baseUrl: "https://example.com",
                status: "ACTIVE",
            },
        })
        createdProviderIds.push(provider.id)

        const res = await createModel({
            providerId: provider.id,
            name: uniqueName(),
            type: "TEXT",
            contextWindow: 1000,
            inputPrice: 0,
            outputPrice: 0,
            freeEligible: true,
        })
        expect(res.status).toBe(201)
        expect(res.body.data.routable).toBe(false)

        const projectRes = await request(app.express)
            .post(`/api/v1/organizations/${authUser.auth.organizationId}/projects`)
            .set(authUser.headers())
            .send({ name: `Non Routable ${provider.name}`, environment: "DEVELOPMENT" })
        const listRes = await request(app.express)
            .get(`/api/v1/projects/${projectRes.body.data.id}/models`)
            .set(authUser.headers())
        expect(
            (listRes.body.data as Array<{ id: number }>).some((m) => m.id === res.body.data.id),
        ).toBe(false)
    })

    it("returns 404 for an unknown model", async () => {
        const res = await request(app.express)
            .get("/api/v1/admin/models/999999999")
            .set(authUser.headers())
        expect(res.status).toBe(404)
    })
})
