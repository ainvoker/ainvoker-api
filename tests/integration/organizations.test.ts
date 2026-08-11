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
        })
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
