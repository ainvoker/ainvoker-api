import request from "supertest"
import { describe, expect, it } from "vitest"
import app from "../../src/app.js"
import { PLAN_NAMES } from "../../src/modules/billing/catalog.js"
import prismaClient from "../../src/platform/prisma.js"
import { useTestAuthUser } from "../helpers/fixtures.js"

describe("GET /api/v1/organizations", () => {
    const authUser = useTestAuthUser()

    it("returns 401 without Authorization", async () => {
        const res = await request(app.express).get("/api/v1/organizations")
        expect(res.status).toBe(401)
        expect(res.body.error.code).toBe("UNAUTHORIZED")
    })

    it("lists personal organization for the seeded auth user", async () => {
        const res = await request(app.express)
            .get("/api/v1/organizations")
            .set(authUser.headers())

        expect(res.status).toBe(200)
        expect(Array.isArray(res.body.data)).toBe(true)
        expect(res.body.data.length).toBeGreaterThanOrEqual(1)
        expect(res.body.data[0]).toMatchObject({
            id: authUser.auth.organizationId,
            name: "Personal",
            role: "owner",
            isPersonal: true,
            permissions: { canEdit: false, canDelete: false },
        })
    })
})

describe("GET /api/v1/organizations/:orgId", () => {
    const authUser = useTestAuthUser()

    it("returns 401 without Authorization", async () => {
        const res = await request(app.express).get(
            `/api/v1/organizations/${authUser.auth.organizationId}`,
        )
        expect(res.status).toBe(401)
        expect(res.body.error.code).toBe("UNAUTHORIZED")
    })

    it("returns the Personal workspace with locked permissions", async () => {
        const res = await request(app.express)
            .get(`/api/v1/organizations/${authUser.auth.organizationId}`)
            .set(authUser.headers())

        expect(res.status).toBe(200)
        expect(res.body.data).toMatchObject({
            id: authUser.auth.organizationId,
            name: "Personal",
            role: "owner",
            isPersonal: true,
            permissions: { canEdit: false, canDelete: false },
        })
    })

    it("returns a non-personal org with edit and delete permissions for owner", async () => {
        const created = await request(app.express)
            .post("/api/v1/organizations")
            .set(authUser.headers())
            .send({
                name: `Get Me ${authUser.auth.userId.slice(-6)}`,
                plan: PLAN_NAMES.pro,
            })
        expect(created.status).toBe(201)
        const orgId = created.body.data.id as string

        const res = await request(app.express)
            .get(`/api/v1/organizations/${orgId}`)
            .set(authUser.headers())

        expect(res.status).toBe(200)
        expect(res.body.data).toMatchObject({
            id: orgId,
            role: "owner",
            isPersonal: false,
            permissions: { canEdit: true, canDelete: true },
        })
    })

    it("returns 404 for an unknown organization", async () => {
        const res = await request(app.express)
            .get("/api/v1/organizations/nonexistent-org-id")
            .set(authUser.headers())

        expect(res.status).toBe(404)
        expect(res.body.error.code).toBe("NOT_FOUND")
    })
})

describe("POST /api/v1/organizations", () => {
    const authUser = useTestAuthUser()

    it("returns 401 without Authorization", async () => {
        const res = await request(app.express)
            .post("/api/v1/organizations")
            .send({ name: "Acme", plan: PLAN_NAMES.pro })
        expect(res.status).toBe(401)
        expect(res.body.error.code).toBe("UNAUTHORIZED")
    })

    it("rejects create without plan (validation)", async () => {
        const res = await request(app.express)
            .post("/api/v1/organizations")
            .set(authUser.headers())
            .send({ name: "Acme Labs" })

        expect(res.status).toBe(400)
        expect(res.body.error.code).toBe("VALIDATION_ERROR")
    })

    it("rejects plan free on create", async () => {
        const res = await request(app.express)
            .post("/api/v1/organizations")
            .set(authUser.headers())
            .send({ name: "Free Abuse", plan: PLAN_NAMES.free })

        expect(res.status).toBe(400)
        expect(res.body.error.code).toBe("VALIDATION_ERROR")
    })

    it("creates a Pro org with PENDING subscription while Personal stays Free", async () => {
        const res = await request(app.express)
            .post("/api/v1/organizations")
            .set(authUser.headers())
            .send({ name: "Acme Labs", plan: PLAN_NAMES.pro })

        expect(res.status).toBe(201)
        expect(res.body.data).toMatchObject({
            name: "Acme Labs",
            slug: "acme-labs",
            role: "owner",
            status: "ACTIVE",
            isPersonal: false,
            permissions: { canEdit: true, canDelete: true },
        })

        const newSub = await prismaClient.subscription.findFirst({
            where: { organizationId: res.body.data.id as string, plan: { name: PLAN_NAMES.pro } },
            include: { plan: true },
        })
        expect(newSub?.status).toBe("PENDING")
        expect(newSub?.plan.name).toBe(PLAN_NAMES.pro)

        const personalSub = await prismaClient.subscription.findFirst({
            where: {
                organizationId: authUser.auth.organizationId,
                status: "ACTIVE",
            },
            include: { plan: true },
        })
        expect(personalSub?.plan.name).toBe(PLAN_NAMES.free)
    })

    it("blocks project creation on PENDING Pro orgs until activated", async () => {
        const createOrg = await request(app.express)
            .post("/api/v1/organizations")
            .set(authUser.headers())
            .send({
                name: `Pending Gate ${authUser.auth.userId.slice(-6)}`,
                plan: PLAN_NAMES.pro,
            })
        expect(createOrg.status).toBe(201)
        const orgId = createOrg.body.data.id as string

        const blocked = await request(app.express)
            .post(`/api/v1/organizations/${orgId}/projects`)
            .set(authUser.headers())
            .send({ name: "Blocked Project", environment: "DEVELOPMENT" })
        expect(blocked.status).toBe(402)
        expect(blocked.body.error.code).toBe("SUBSCRIPTION_REQUIRED")

        await prismaClient.subscription.updateMany({
            where: { organizationId: orgId, status: "PENDING" },
            data: { status: "ACTIVE" },
        })

        const allowed = await request(app.express)
            .post(`/api/v1/organizations/${orgId}/projects`)
            .set(authUser.headers())
            .send({ name: "Allowed Project", environment: "DEVELOPMENT" })
        expect(allowed.status).toBe(201)
        expect(allowed.body.data.name).toBe("Allowed Project")
    })

    it("soft-deletes a non-personal org and keeps Personal Free plan", async () => {
        const createOrg = await request(app.express)
            .post("/api/v1/organizations")
            .set(authUser.headers())
            .send({
                name: `Delete Me ${authUser.auth.userId.slice(-6)}`,
                plan: PLAN_NAMES.pro,
            })
        expect(createOrg.status).toBe(201)
        const orgId = createOrg.body.data.id as string

        const deleteRes = await request(app.express)
            .delete(`/api/v1/organizations/${orgId}`)
            .set(authUser.headers())
        expect(deleteRes.status).toBe(200)
        expect(deleteRes.body.data).toEqual({ deleted: true })

        const listed = await request(app.express)
            .get("/api/v1/organizations")
            .set(authUser.headers())
        expect(listed.status).toBe(200)
        expect(listed.body.data.some((org: { id: string }) => org.id === orgId)).toBe(false)
        expect(
            listed.body.data.some(
                (org: { id: string }) => org.id === authUser.auth.organizationId,
            ),
        ).toBe(true)

        const deletedOrg = await prismaClient.organization.findUnique({
            where: { id: orgId },
        })
        expect(deletedOrg?.status).toBe("DELETED")

        const canceled = await prismaClient.subscription.findMany({
            where: { organizationId: orgId },
        })
        expect(canceled.every((sub) => sub.status === "CANCELED")).toBe(true)

        const personalSub = await prismaClient.subscription.findFirst({
            where: {
                organizationId: authUser.auth.organizationId,
                status: "ACTIVE",
            },
            include: { plan: true },
        })
        expect(personalSub?.plan.name).toBe(PLAN_NAMES.free)
    })

    it("rejects deleting the Personal workspace", async () => {
        const res = await request(app.express)
            .delete(`/api/v1/organizations/${authUser.auth.organizationId}`)
            .set(authUser.headers())
        expect(res.status).toBe(403)
        expect(res.body.error.code).toBe("FORBIDDEN")
    })

    it("rejects Scale org creation (contact sales)", async () => {
        const res = await request(app.express)
            .post("/api/v1/organizations")
            .set(authUser.headers())
            .send({ name: "Scale Co", plan: PLAN_NAMES.scale })

        expect(res.status).toBe(403)
        expect(res.body.error.code).toBe("PLAN_CONTACT_REQUIRED")
    })

    it("rejects a duplicate explicit slug", async () => {
        const first = await request(app.express)
            .post("/api/v1/organizations")
            .set(authUser.headers())
            .send({ name: "Unique Slug Co", slug: "unique-slug-co", plan: PLAN_NAMES.pro })

        expect(first.status).toBe(201)

        const second = await request(app.express)
            .post("/api/v1/organizations")
            .set(authUser.headers())
            .send({ name: "Another", slug: "unique-slug-co", plan: PLAN_NAMES.pro })

        expect(second.status).toBe(409)
        expect(second.body.error.code).toBe("CONFLICT")
    })
})

describe("PATCH /api/v1/organizations/:orgId", () => {
    const authUser = useTestAuthUser()

    it("returns 401 without Authorization", async () => {
        const res = await request(app.express)
            .patch(`/api/v1/organizations/${authUser.auth.organizationId}`)
            .send({ name: "Renamed" })
        expect(res.status).toBe(401)
        expect(res.body.error.code).toBe("UNAUTHORIZED")
    })

    it("rejects renaming the Personal workspace", async () => {
        const res = await request(app.express)
            .patch(`/api/v1/organizations/${authUser.auth.organizationId}`)
            .set(authUser.headers())
            .send({ name: "Not Personal" })
        expect(res.status).toBe(403)
        expect(res.body.error.code).toBe("FORBIDDEN")
    })

    it("renames a non-personal org and can update its slug", async () => {
        const created = await request(app.express)
            .post("/api/v1/organizations")
            .set(authUser.headers())
            .send({
                name: `Rename Me ${authUser.auth.userId.slice(-6)}`,
                plan: PLAN_NAMES.pro,
            })
        expect(created.status).toBe(201)
        const orgId = created.body.data.id as string
        const nextSlug = `renamed-${authUser.auth.userId.slice(-8).toLowerCase()}`

        const res = await request(app.express)
            .patch(`/api/v1/organizations/${orgId}`)
            .set(authUser.headers())
            .send({ name: "Renamed Labs", slug: nextSlug })

        expect(res.status).toBe(200)
        expect(res.body.data).toMatchObject({
            id: orgId,
            name: "Renamed Labs",
            slug: nextSlug,
            role: "owner",
            isPersonal: false,
            permissions: { canEdit: true, canDelete: true },
        })

        const listed = await request(app.express)
            .get("/api/v1/organizations")
            .set(authUser.headers())
        expect(listed.status).toBe(200)
        expect(
            listed.body.data.some(
                (org: { id: string; name: string; slug: string }) =>
                    org.id === orgId && org.name === "Renamed Labs" && org.slug === nextSlug,
            ),
        ).toBe(true)
    })

    it("rejects a duplicate slug on update", async () => {
        const first = await request(app.express)
            .post("/api/v1/organizations")
            .set(authUser.headers())
            .send({ name: "Slug One", slug: "slug-one-unique", plan: PLAN_NAMES.pro })
        expect(first.status).toBe(201)

        const second = await request(app.express)
            .post("/api/v1/organizations")
            .set(authUser.headers())
            .send({ name: "Slug Two", plan: PLAN_NAMES.pro })
        expect(second.status).toBe(201)

        const res = await request(app.express)
            .patch(`/api/v1/organizations/${second.body.data.id as string}`)
            .set(authUser.headers())
            .send({ slug: "slug-one-unique" })

        expect(res.status).toBe(409)
        expect(res.body.error.code).toBe("CONFLICT")
    })

    it("rejects a Personal-prefixed slug", async () => {
        const created = await request(app.express)
            .post("/api/v1/organizations")
            .set(authUser.headers())
            .send({
                name: `Prefix Check ${authUser.auth.userId.slice(-6)}`,
                plan: PLAN_NAMES.pro,
            })
        expect(created.status).toBe(201)

        const res = await request(app.express)
            .patch(`/api/v1/organizations/${created.body.data.id as string}`)
            .set(authUser.headers())
            .send({ slug: "personal-taken" })

        expect(res.status).toBe(400)
        expect(res.body.error.code).toBe("VALIDATION_ERROR")
    })

    it("rejects an empty update body", async () => {
        const created = await request(app.express)
            .post("/api/v1/organizations")
            .set(authUser.headers())
            .send({
                name: `Empty Body ${authUser.auth.userId.slice(-6)}`,
                plan: PLAN_NAMES.pro,
            })
        expect(created.status).toBe(201)

        const res = await request(app.express)
            .patch(`/api/v1/organizations/${created.body.data.id as string}`)
            .set(authUser.headers())
            .send({})

        expect(res.status).toBe(400)
        expect(res.body.error.code).toBe("VALIDATION_ERROR")
    })
})
