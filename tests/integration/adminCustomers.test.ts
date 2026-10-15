import request from "supertest"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import app from "../../src/app.js"
import env from "../../src/config/env.js"
import { textCatalogDefaults } from "../../src/modules/catalog/seed.js"
import apiKeyHasher from "../../src/platform/hash.js"
import prismaClient from "../../src/platform/prisma.js"
import { useTestAuthUser } from "../helpers/fixtures.js"
import "../../src/providers/index.js"

describe("admin customers endpoints", () => {
    const authUser = useTestAuthUser({
        profile: {
            email: "admin-customers@example.com",
            firstName: "Admin",
            lastName: "Customers",
        },
    })

    beforeEach(() => {
        vi.spyOn(env, "isPlatformAdmin").mockImplementation(
            (userId) => userId === authUser.auth.userId,
        )
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it("returns 401 without Authorization", async () => {
        const res = await request(app.express).get("/api/v1/admin/organizations")
        expect(res.status).toBe(401)
    })

    it("returns 403 for users who are not platform admins", async () => {
        vi.spyOn(env, "isPlatformAdmin").mockReturnValue(false)
        const res = await request(app.express)
            .get("/api/v1/admin/organizations")
            .set(authUser.headers())
        expect(res.status).toBe(403)
        expect(res.body.error.code).toBe("FORBIDDEN")
    })

    it("lists organizations with owner and plan", async () => {
        const res = await request(app.express)
            .get("/api/v1/admin/organizations")
            .set(authUser.headers())
        expect(res.status).toBe(200)
        expect(res.body.data.total).toBeGreaterThanOrEqual(1)

        const mine = (res.body.data.items as Array<{ id: string }>).find(
            (o) => o.id === authUser.auth.organizationId,
        )
        expect(mine).toMatchObject({
            id: authUser.auth.organizationId,
            isPersonal: true,
            memberCount: 1,
            planName: "free",
            owner: { id: authUser.auth.userId, email: "admin-customers@example.com" },
        })
    })

    it("searches organizations by owner email", async () => {
        const res = await request(app.express)
            .get("/api/v1/admin/organizations")
            .query({ q: "admin-customers@example.com" })
            .set(authUser.headers())
        expect(res.status).toBe(200)
        expect(res.body.data.items.some((o: { id: string }) => o.id === authUser.auth.organizationId)).toBe(
            true,
        )
    })

    it("returns organization detail with nested projects, keys, and invites", async () => {
        const project = await prismaClient.project.create({
            data: {
                organizationId: authUser.auth.organizationId,
                name: "Support Project",
                environment: "DEVELOPMENT",
            },
        })
        await prismaClient.apiKey.create({
            data: {
                projectId: project.id,
                keyName: "Support Key",
                keyHash: `hash-${authUser.auth.userId}`,
                keyPrefix: "ain_support",
                status: "ACTIVE",
                clientType: "SERVER",
            },
        })

        const res = await request(app.express)
            .get(`/api/v1/admin/organizations/${authUser.auth.organizationId}`)
            .set(authUser.headers())
        expect(res.status).toBe(200)
        expect(res.body.data).toMatchObject({
            id: authUser.auth.organizationId,
            isPersonal: true,
            memberCount: 1,
            subscription: { planName: "free", status: "ACTIVE" },
        })
        expect(res.body.data.projects).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ id: project.id, name: "Support Project", apiKeyCount: 1 }),
            ]),
        )
        expect(res.body.data.apiKeys).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    projectId: project.id,
                    keyName: "Support Key",
                    keyPrefix: "ain_support",
                }),
            ]),
        )
        expect(res.body.data.invites).toEqual([])
    })

    it("suspends and reinstates an organization", async () => {
        const orgId = authUser.auth.organizationId

        const suspended = await request(app.express)
            .patch(`/api/v1/admin/organizations/${orgId}`)
            .set(authUser.headers())
            .send({ status: "SUSPENDED" })
        expect(suspended.status).toBe(200)
        expect(suspended.body.data.status).toBe("SUSPENDED")

        const reinstated = await request(app.express)
            .patch(`/api/v1/admin/organizations/${orgId}`)
            .set(authUser.headers())
            .send({ status: "ACTIVE" })
        expect(reinstated.status).toBe(200)
        expect(reinstated.body.data.status).toBe("ACTIVE")
    })

    it("rejects status changes on deleted organizations", async () => {
        const orgId = authUser.auth.organizationId
        await prismaClient.organization.update({
            where: { id: orgId },
            data: { status: "DELETED" },
        })

        const res = await request(app.express)
            .patch(`/api/v1/admin/organizations/${orgId}`)
            .set(authUser.headers())
            .send({ status: "ACTIVE" })
        expect(res.status).toBe(400)
        expect(res.body.error.code).toBe("VALIDATION_ERROR")
    })

    it("blocks API key inference when the organization is suspended", async () => {
        const project = await prismaClient.project.create({
            data: {
                organizationId: authUser.auth.organizationId,
                name: "Suspended Inference",
                environment: "DEVELOPMENT",
            },
        })
        const generated = apiKeyHasher.generate()
        await prismaClient.apiKey.create({
            data: {
                projectId: project.id,
                keyName: "Inference Key",
                keyHash: generated.keyHash,
                keyPrefix: generated.keyPrefix,
                status: "ACTIVE",
            },
        })

        await prismaClient.organization.update({
            where: { id: authUser.auth.organizationId },
            data: { status: "SUSPENDED" },
        })

        const res = await request(app.express)
            .post("/v1/text/chat")
            .set({ Authorization: `Bearer ${generated.plaintext}` })
            .send({
                model: textCatalogDefaults.modelSlug,
                messages: [{ role: "user", content: "Hi" }],
            })

        expect(res.status).toBe(403)
        expect(res.body.error).toMatchObject({
            code: "FORBIDDEN",
            message: "Organization is not active",
        })
    })

    it("lists and gets users with memberships", async () => {
        const list = await request(app.express)
            .get("/api/v1/admin/users")
            .query({ q: "admin-customers@example.com" })
            .set(authUser.headers())
        expect(list.status).toBe(200)
        expect(list.body.data.items).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: authUser.auth.userId,
                    email: "admin-customers@example.com",
                    isPlatformAdmin: true,
                    membershipCount: 1,
                }),
            ]),
        )

        const detail = await request(app.express)
            .get(`/api/v1/admin/users/${authUser.auth.userId}`)
            .set(authUser.headers())
        expect(detail.status).toBe(200)
        expect(detail.body.data).toMatchObject({
            id: authUser.auth.userId,
            isPlatformAdmin: true,
        })
        expect(detail.body.data.memberships).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    role: "owner",
                    organization: expect.objectContaining({
                        id: authUser.auth.organizationId,
                        isPersonal: true,
                    }),
                }),
            ]),
        )
    })
})
