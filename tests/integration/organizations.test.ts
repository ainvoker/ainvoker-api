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
