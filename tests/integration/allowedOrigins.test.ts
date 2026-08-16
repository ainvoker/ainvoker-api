import request from "supertest"
import { beforeEach, describe, expect, it } from "vitest"
import app from "../../src/app.js"
import { MAX_ALLOWED_ORIGINS_PER_PROJECT } from "../../src/platform/origin.js"
import prismaClient from "../../src/platform/prisma.js"
import { useTestAuthUser } from "../helpers/fixtures.js"

describe("allowed origins endpoints", () => {
    const authUser = useTestAuthUser()
    let projectId = ""

    beforeEach(async () => {
        const project = await prismaClient.project.create({
            data: {
                organizationId: authUser.auth.organizationId,
                name: `Origins Project ${authUser.auth.userId.slice(-8)}`,
                environment: "DEVELOPMENT",
            },
        })
        projectId = project.id
    })

    it("returns 401 without Authorization", async () => {
        const res = await request(app.express).get(
            `/api/v1/projects/${projectId}/allowed-origins`,
        )
        expect(res.status).toBe(401)
    })

    it("creates, lists, and deletes an allowed origin", async () => {
        const createRes = await request(app.express)
            .post(`/api/v1/projects/${projectId}/allowed-origins`)
            .set(authUser.headers())
            .send({ origin: "https://app.example.com/" })

        expect(createRes.status).toBe(201)
        expect(createRes.body.data).toMatchObject({
            projectId,
            origin: "https://app.example.com",
        })

        const originId = createRes.body.data.id as string

        const listRes = await request(app.express)
            .get(`/api/v1/projects/${projectId}/allowed-origins`)
            .set(authUser.headers())
        expect(listRes.status).toBe(200)
        expect(listRes.body.data.some((row: { id: string }) => row.id === originId)).toBe(true)

        const deleteRes = await request(app.express)
            .delete(`/api/v1/projects/${projectId}/allowed-origins/${originId}`)
            .set(authUser.headers())
        expect(deleteRes.status).toBe(200)
        expect(deleteRes.body.data).toEqual({ deleted: true })

        const listAfter = await request(app.express)
            .get(`/api/v1/projects/${projectId}/allowed-origins`)
            .set(authUser.headers())
        expect(listAfter.body.data.some((row: { id: string }) => row.id === originId)).toBe(false)
    })

    it("rejects duplicate origins and invalid values", async () => {
        const first = await request(app.express)
            .post(`/api/v1/projects/${projectId}/allowed-origins`)
            .set(authUser.headers())
            .send({ origin: "http://localhost:5173" })
        expect(first.status).toBe(201)

        const dup = await request(app.express)
            .post(`/api/v1/projects/${projectId}/allowed-origins`)
            .set(authUser.headers())
            .send({ origin: "http://localhost:5173" })
        expect(dup.status).toBe(409)

        const invalid = await request(app.express)
            .post(`/api/v1/projects/${projectId}/allowed-origins`)
            .set(authUser.headers())
            .send({ origin: "http://evil.example.com" })
        expect(invalid.status).toBe(400)
        expect(invalid.body.error.code).toBe("VALIDATION_ERROR")
    })

    it("enforces the per-project origin cap", async () => {
        for (let i = 0; i < MAX_ALLOWED_ORIGINS_PER_PROJECT; i++) {
            const res = await request(app.express)
                .post(`/api/v1/projects/${projectId}/allowed-origins`)
                .set(authUser.headers())
                .send({ origin: `https://app${i}.example.com` })
            expect(res.status).toBe(201)
        }

        const overflow = await request(app.express)
            .post(`/api/v1/projects/${projectId}/allowed-origins`)
            .set(authUser.headers())
            .send({ origin: "https://overflow.example.com" })
        expect(overflow.status).toBe(400)
        expect(overflow.body.error.message).toMatch(/at most/i)
    })
})
