import { randomUUID } from "node:crypto"
import request from "supertest"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import app from "../../src/app.js"
import env from "../../src/config/env.js"
import { ensureBusinessSettings } from "../../src/modules/business/retail.js"
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

    it("lists seeded models with provider and retail prices", async () => {
        const res = await request(app.express).get("/api/v1/admin/models").set(authUser.headers())
        expect(res.status).toBe(200)
        const mini = (res.body.data as Array<{ slug: string }>).find(
            (m) => m.slug === "openai/gpt-4o-mini",
        )
        expect(mini).toBeDefined()
        expect(mini).toMatchObject({
            providerInputPrice: expect.any(String),
            inputPrice: expect.any(String),
            planTier: "ECONOMY",
        })
    })

    it("does not allow creating models via admin API", async () => {
        const res = await request(app.express)
            .post("/api/v1/admin/models")
            .set(authUser.headers())
            .send({ name: "x" })
        expect(res.status).toBe(404)
    })

    it("updates status only", async () => {
        const mini = await prismaClient.aIModel.findFirstOrThrow({
            where: { name: "gpt-4o-mini" },
        })
        const res = await request(app.express)
            .patch(`/api/v1/admin/models/${mini.id}`)
            .set(authUser.headers())
            .send({ status: "INACTIVE" })
        expect(res.status).toBe(200)
        expect(res.body.data.status).toBe("INACTIVE")
        await prismaClient.aIModel.update({
            where: { id: mini.id },
            data: { status: "ACTIVE" },
        })
    })

    it("updates planTier and freeEligible", async () => {
        const mini = await prismaClient.aIModel.findFirstOrThrow({
            where: { name: "gpt-4o-mini" },
        })
        try {
            const notFree = await request(app.express)
                .patch(`/api/v1/admin/models/${mini.id}`)
                .set(authUser.headers())
                .send({ freeEligible: false })
            expect(notFree.status).toBe(200)
            expect(notFree.body.data).toMatchObject({ planTier: "ECONOMY", freeEligible: false })

            const premium = await request(app.express)
                .patch(`/api/v1/admin/models/${mini.id}`)
                .set(authUser.headers())
                .send({ planTier: "PREMIUM" })
            expect(premium.status).toBe(200)
            expect(premium.body.data).toMatchObject({ planTier: "PREMIUM", freeEligible: false })
            const settings = await ensureBusinessSettings()
            expect(premium.body.data.inputPrice).toBe(
                mini.providerInputPrice.mul(settings.premiumMarkupMultiplier).toString(),
            )

            const rejected = await request(app.express)
                .patch(`/api/v1/admin/models/${mini.id}`)
                .set(authUser.headers())
                .send({ freeEligible: true })
            expect(rejected.status).toBe(400)
            expect(rejected.body.error.code).toBe("VALIDATION_ERROR")
        } finally {
            await request(app.express)
                .patch(`/api/v1/admin/models/${mini.id}`)
                .set(authUser.headers())
                .send({ planTier: "ECONOMY", freeEligible: true })
        }
    })

    it("rejects an empty update body", async () => {
        const mini = await prismaClient.aIModel.findFirstOrThrow({
            where: { name: "gpt-4o-mini" },
        })
        const res = await request(app.express)
            .patch(`/api/v1/admin/models/${mini.id}`)
            .set(authUser.headers())
            .send({})
        expect(res.status).toBe(400)
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

        const model = await prismaClient.aIModel.create({
            data: {
                providerId: provider.id,
                name: `vitest-${randomUUID().slice(0, 8)}`,
                type: "TEXT",
                contextWindow: 1000,
                providerInputPrice: 0.1,
                providerOutputPrice: 0.2,
                inputPrice: 0.12,
                outputPrice: 0.24,
                planTier: "ECONOMY",
                freeEligible: true,
                status: "ACTIVE",
            },
        })
        createdModelIds.push(model.id)

        const adminList = await request(app.express)
            .get("/api/v1/admin/models")
            .set(authUser.headers())
        const row = (adminList.body.data as Array<{ id: number; routable: boolean }>).find(
            (m) => m.id === model.id,
        )
        expect(row?.routable).toBe(false)

        const projectRes = await request(app.express)
            .post(`/api/v1/organizations/${authUser.auth.organizationId}/projects`)
            .set(authUser.headers())
            .send({ name: `Non Routable ${provider.name}`, environment: "DEVELOPMENT" })
        const listRes = await request(app.express)
            .get(`/api/v1/projects/${projectRes.body.data.id}/models`)
            .set(authUser.headers())
        expect(
            (listRes.body.data as Array<{ id: number }>).some((m) => m.id === model.id),
        ).toBe(false)
    })

    it("returns 404 for an unknown model", async () => {
        const res = await request(app.express)
            .get("/api/v1/admin/models/999999999")
            .set(authUser.headers())
        expect(res.status).toBe(404)
    })
})
