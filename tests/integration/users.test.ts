import request from "supertest"
import { describe, expect, it } from "vitest"
import app from "../../src/app.js"
import prismaClient from "../../src/platform/prisma.js"
import { useEphemeralAuthId, useTestAuthUser } from "../helpers/fixtures.js"

describe("user creation (signup bootstrap)", () => {
    const ephemeral = useEphemeralAuthId()

    it("creates app User + Personal org via POST /me/bootstrap", async () => {
        const before = await prismaClient.user.findUnique({ where: { id: ephemeral.userId } })
        expect(before).toBeNull()

        const res = await request(app.express)
            .post("/api/v1/me/bootstrap")
            .set(ephemeral.headers())
            .send({
                email: "ada@example.com",
                firstName: "Ada",
                lastName: "Lovelace",
            })

        expect(res.status).toBe(200)
        expect(res.body.data.user).toMatchObject({
            id: ephemeral.userId,
            email: "ada@example.com",
            firstName: "Ada",
            lastName: "Lovelace",
        })
        expect(res.body.data.memberships).toHaveLength(1)
        expect(res.body.data.memberships[0]).toMatchObject({
            role: "owner",
            organization: { name: "Personal" },
        })

        const user = await prismaClient.user.findUniqueOrThrow({
            where: { id: ephemeral.userId },
        })
        expect(user.firstName).toBe("Ada")
        expect(user.email).toBe("ada@example.com")

        const memberships = await prismaClient.organizationMember.findMany({
            where: { userId: ephemeral.userId },
            include: { organization: true, role: true },
        })
        expect(memberships).toHaveLength(1)
        expect(memberships[0].organization.name).toBe("Personal")
        expect(memberships[0].role.name).toBe("owner")
    })

    it("creates app User + Personal org via GET /me", async () => {
        const res = await request(app.express).get("/api/v1/me").set(ephemeral.headers())

        expect(res.status).toBe(200)
        expect(res.body.data.user).toMatchObject({
            id: ephemeral.userId,
            email: null,
            firstName: null,
            lastName: null,
            profilePicture: null,
            themePreference: "DEVICE",
        })
        expect(res.body.data.memberships.length).toBeGreaterThanOrEqual(1)
        expect(res.body.data.memberships[0].organization.name).toBe("Personal")
        expect(res.body.data.memberships[0].role).toBe("owner")
    })

    it("bootstrap is idempotent and does not overwrite profile", async () => {
        await request(app.express)
            .post("/api/v1/me/bootstrap")
            .set(ephemeral.headers())
            .send({ email: "ada@example.com", firstName: "Ada", lastName: "Lovelace" })

        const res = await request(app.express)
            .post("/api/v1/me/bootstrap")
            .set(ephemeral.headers())
            .send({ email: "grace@example.com", firstName: "Grace", lastName: "Hopper" })

        expect(res.status).toBe(200)
        expect(res.body.data.user).toMatchObject({
            email: "ada@example.com",
            firstName: "Ada",
            lastName: "Lovelace",
        })
    })

    it("bootstrap fills empty profile after GET /me", async () => {
        await request(app.express).get("/api/v1/me").set(ephemeral.headers())

        const res = await request(app.express)
            .post("/api/v1/me/bootstrap")
            .set(ephemeral.headers())
            .send({ email: "ada@example.com", firstName: "Ada", lastName: "Lovelace" })

        expect(res.status).toBe(200)
        expect(res.body.data.user).toMatchObject({
            email: "ada@example.com",
            firstName: "Ada",
            lastName: "Lovelace",
        })
    })
})

describe("users /me with existing auth user", () => {
    const authUser = useTestAuthUser({
        profile: { email: "seeded@example.com", firstName: "Seeded", lastName: "User" },
    })

    it("GET /api/v1/me returns the seeded user and Personal org", async () => {
        const res = await request(app.express).get("/api/v1/me").set(authUser.headers())

        expect(res.status).toBe(200)
        expect(res.body.data.user).toMatchObject({
            id: authUser.auth.userId,
            email: "seeded@example.com",
            firstName: "Seeded",
            lastName: "User",
        })
        expect(res.body.data.memberships[0].organization.id).toBe(authUser.auth.organizationId)
        expect(res.body.data.memberships[0].role).toBe("owner")
    })

    it("PATCH /api/v1/me updates profile fields", async () => {
        const patchRes = await request(app.express)
            .patch("/api/v1/me")
            .set(authUser.headers())
            .send({
                email: "ada@example.com",
                firstName: "Ada",
                lastName: "Lovelace",
                profilePicture: "https://example.com/ada.png",
            })

        expect(patchRes.status).toBe(200)
        expect(patchRes.body.data).toMatchObject({
            id: authUser.auth.userId,
            email: "ada@example.com",
            firstName: "Ada",
            lastName: "Lovelace",
            profilePicture: "https://example.com/ada.png",
        })

        const getRes = await request(app.express).get("/api/v1/me").set(authUser.headers())
        expect(getRes.body.data.user).toMatchObject({
            email: "ada@example.com",
            firstName: "Ada",
            lastName: "Lovelace",
            profilePicture: "https://example.com/ada.png",
        })
    })

    it("PATCH /api/v1/me updates themePreference", async () => {
        const patchRes = await request(app.express)
            .patch("/api/v1/me")
            .set(authUser.headers())
            .send({ themePreference: "DARK" })

        expect(patchRes.status).toBe(200)
        expect(patchRes.body.data).toMatchObject({
            id: authUser.auth.userId,
            themePreference: "DARK",
        })

        const getRes = await request(app.express).get("/api/v1/me").set(authUser.headers())
        expect(getRes.body.data.user.themePreference).toBe("DARK")
    })

    it("PATCH /api/v1/me returns 401 without Authorization", async () => {
        const res = await request(app.express).patch("/api/v1/me").send({ firstName: "Ada" })
        expect(res.status).toBe(401)
    })

    it("PATCH /api/v1/me rejects empty body", async () => {
        const res = await request(app.express)
            .patch("/api/v1/me")
            .set(authUser.headers())
            .send({})

        expect(res.status).toBe(400)
        expect(res.body.error.code).toBe("VALIDATION_ERROR")
    })

    it("GET /api/v1/me returns 401 without Authorization", async () => {
        const res = await request(app.express).get("/api/v1/me")
        expect(res.status).toBe(401)
        expect(res.body.error.code).toBe("UNAUTHORIZED")
    })
})
