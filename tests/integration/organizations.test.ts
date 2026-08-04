import request from "supertest"
import { describe, expect, it } from "vitest"
import app from "../../src/app.js"
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
            .send({ name: "Acme" })
        expect(res.status).toBe(401)
        expect(res.body.error.code).toBe("UNAUTHORIZED")
    })

    it("creates an organization and makes the caller owner", async () => {
        const res = await request(app.express)
            .post("/api/v1/organizations")
            .set(authUser.headers())
            .send({ name: "Acme Labs" })

        expect(res.status).toBe(201)
        expect(res.body.data).toMatchObject({
            name: "Acme Labs",
            slug: "acme-labs",
            role: "owner",
            status: "ACTIVE",
        })
        expect(res.body.data.id).toBeTruthy()

        const list = await request(app.express)
            .get("/api/v1/organizations")
            .set(authUser.headers())

        expect(list.status).toBe(200)
        expect(list.body.data.some((org: { id: string }) => org.id === res.body.data.id)).toBe(
            true,
        )
    })

    it("rejects a duplicate explicit slug", async () => {
        const first = await request(app.express)
            .post("/api/v1/organizations")
            .set(authUser.headers())
            .send({ name: "Unique Slug Co", slug: "unique-slug-co" })

        expect(first.status).toBe(201)

        const second = await request(app.express)
            .post("/api/v1/organizations")
            .set(authUser.headers())
            .send({ name: "Another", slug: "unique-slug-co" })

        expect(second.status).toBe(409)
        expect(second.body.error.code).toBe("CONFLICT")
    })
})
