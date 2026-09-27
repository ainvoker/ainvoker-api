import request from "supertest"
import { beforeEach, describe, expect, it } from "vitest"
import app from "../../src/app.js"
import { ensureBillingCatalog, getPlanByName, PLAN_NAMES } from "../../src/modules/billing/catalog.js"
import { ensureTextCatalog, textCatalogDefaults } from "../../src/modules/text/catalog.js"
import prismaClient from "../../src/platform/prisma.js"
import {
    cleanupTestUser,
    seedUserWithPersonalOrg,
    testUserId,
} from "../helpers/db.js"
import { authHeader } from "../helpers/auth.js"
import { useTestAuthUser } from "../helpers/fixtures.js"

describe("project models endpoints", () => {
    const authUser = useTestAuthUser()
    let projectId = ""

    beforeEach(async () => {
        await ensureTextCatalog()
        const createRes = await request(app.express)
            .post(`/api/v1/organizations/${authUser.auth.organizationId}/projects`)
            .set(authUser.headers())
            .send({
                name: `Models Project ${authUser.auth.userId.slice(-8)}`,
                environment: "DEVELOPMENT",
            })
        expect(createRes.status).toBe(201)
        projectId = createRes.body.data.id as string
    })

    it("returns 401 without Authorization", async () => {
        const res = await request(app.express).get(`/api/v1/projects/${projectId}/models`)
        expect(res.status).toBe(401)
    })

    it("starts a new project with plan-allowed models enabled", async () => {
        const listRes = await request(app.express)
            .get(`/api/v1/projects/${projectId}/models`)
            .set(authUser.headers())

        expect(listRes.status).toBe(200)
        const rows = listRes.body.data as Array<{
            slug: string
            enabled: boolean
            locked: boolean
            freeEligible: boolean
        }>
        expect(rows.length).toBeGreaterThanOrEqual(2)

        const openai = rows.find((row) => row.slug === textCatalogDefaults.modelSlug)
        const gemini = rows.find((row) => row.slug === textCatalogDefaults.geminiModelSlug)
        expect(openai).toMatchObject({ enabled: true, locked: false, freeEligible: true })
        expect(gemini).toMatchObject({ enabled: true, locked: false, freeEligible: true })

        const allows = await prismaClient.projectModelAllow.findMany({
            where: { projectId, enabled: true },
        })
        expect(allows.length).toBeGreaterThanOrEqual(2)
    })

    it("lets an owner toggle a model", async () => {
        const listRes = await request(app.express)
            .get(`/api/v1/projects/${projectId}/models`)
            .set(authUser.headers())
        const openai = (listRes.body.data as Array<{ id: number; slug: string }>).find(
            (row) => row.slug === textCatalogDefaults.modelSlug,
        )
        expect(openai).toBeTruthy()

        const disableRes = await request(app.express)
            .patch(`/api/v1/projects/${projectId}/models/${openai!.id}`)
            .set(authUser.headers())
            .send({ enabled: false })

        expect(disableRes.status).toBe(200)
        expect(disableRes.body.data).toMatchObject({
            id: openai!.id,
            enabled: false,
            locked: false,
        })

        const enableRes = await request(app.express)
            .patch(`/api/v1/projects/${projectId}/models/${openai!.id}`)
            .set(authUser.headers())
            .send({ enabled: true })
        expect(enableRes.status).toBe(200)
        expect(enableRes.body.data.enabled).toBe(true)
    })

    it("forbids members from toggling models", async () => {
        const member = await seedUserWithPersonalOrg(testUserId(), {
            email: `member-${authUser.auth.userId.slice(-6)}@example.com`,
        })
        const memberRole = await prismaClient.role.findUniqueOrThrow({
            where: { name: "member" },
        })
        await prismaClient.organizationMember.create({
            data: {
                organizationId: authUser.auth.organizationId,
                userId: member.userId,
                roleId: memberRole.id,
            },
        })

        const listRes = await request(app.express)
            .get(`/api/v1/projects/${projectId}/models`)
            .set(authHeader(member.userId))
        expect(listRes.status).toBe(200)
        const modelId = (listRes.body.data as Array<{ id: number }>)[0]?.id
        expect(modelId).toBeTruthy()

        const toggleRes = await request(app.express)
            .patch(`/api/v1/projects/${projectId}/models/${modelId}`)
            .set(authHeader(member.userId))
            .send({ enabled: false })

        expect(toggleRes.status).toBe(403)
        expect(toggleRes.body.error.code).toBe("FORBIDDEN")

        await prismaClient.organizationMember.deleteMany({
            where: {
                organizationId: authUser.auth.organizationId,
                userId: member.userId,
            },
        })
        await cleanupTestUser(member.userId)
    })

    it("rejects toggling a plan-locked model", async () => {
        await ensureTextCatalog()
        const openai = await prismaClient.aIProvider.findUniqueOrThrow({
            where: { name: "openai" },
        })
        const locked = await prismaClient.aIModel.upsert({
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

        const listRes = await request(app.express)
            .get(`/api/v1/projects/${projectId}/models`)
            .set(authUser.headers())
        const row = (listRes.body.data as Array<{ id: number; locked: boolean; enabled: boolean }>).find(
            (item) => item.id === locked.id,
        )
        expect(row).toMatchObject({ locked: true, enabled: false })

        const toggleRes = await request(app.express)
            .patch(`/api/v1/projects/${projectId}/models/${locked.id}`)
            .set(authUser.headers())
            .send({ enabled: true })

        expect(toggleRes.status).toBe(403)
        expect(toggleRes.body.error.code).toBe("MODEL_NOT_ALLOWED_ON_PLAN")
    })

    it("lets an admin toggle a model", async () => {
        const admin = await seedUserWithPersonalOrg(testUserId(), {
            email: `admin-${authUser.auth.userId.slice(-6)}@example.com`,
        })
        const adminRole = await prismaClient.role.findUniqueOrThrow({
            where: { name: "admin" },
        })
        await prismaClient.organizationMember.create({
            data: {
                organizationId: authUser.auth.organizationId,
                userId: admin.userId,
                roleId: adminRole.id,
            },
        })

        const listRes = await request(app.express)
            .get(`/api/v1/projects/${projectId}/models`)
            .set(authHeader(admin.userId))
        const modelId = (listRes.body.data as Array<{ id: number }>)[0]?.id
        expect(modelId).toBeTruthy()

        const toggleRes = await request(app.express)
            .patch(`/api/v1/projects/${projectId}/models/${modelId}`)
            .set(authHeader(admin.userId))
            .send({ enabled: false })

        expect(toggleRes.status).toBe(200)
        expect(toggleRes.body.data.enabled).toBe(false)

        await prismaClient.organizationMember.deleteMany({
            where: {
                organizationId: authUser.auth.organizationId,
                userId: admin.userId,
            },
        })
        await cleanupTestUser(admin.userId)
    })
})

describe("project models on Pro", () => {
    const authUser = useTestAuthUser()

    it("lists plan-locked models as unlocked after upgrading to Pro", async () => {
        await ensureBillingCatalog()
        await ensureTextCatalog()

        const pro = await getPlanByName(PLAN_NAMES.pro)
        await prismaClient.subscription.updateMany({
            where: { organizationId: authUser.auth.organizationId, status: "ACTIVE" },
            data: { status: "CANCELED" },
        })
        await prismaClient.subscription.create({
            data: {
                organizationId: authUser.auth.organizationId,
                planId: pro.id,
                status: "ACTIVE",
                startedAt: new Date(),
            },
        })

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

        const createRes = await request(app.express)
            .post(`/api/v1/organizations/${authUser.auth.organizationId}/projects`)
            .set(authUser.headers())
            .send({
                name: `Pro Models ${authUser.auth.userId.slice(-8)}`,
                environment: "DEVELOPMENT",
            })
        expect(createRes.status).toBe(201)

        const listRes = await request(app.express)
            .get(`/api/v1/projects/${createRes.body.data.id}/models`)
            .set(authUser.headers())
        expect(listRes.status).toBe(200)

        const gpt4o = (listRes.body.data as Array<{ slug: string; enabled: boolean; locked: boolean }>).find(
            (row) => row.slug === "openai/gpt-4o",
        )
        expect(gpt4o).toMatchObject({ enabled: true, locked: false })
    })
})
