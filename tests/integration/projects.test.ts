import request from "supertest"
import { describe, expect, it } from "vitest"
import app from "../../src/app.js"
import { useTestAuthUser } from "../helpers/fixtures.js"

describe("projects endpoints", () => {
    const authUser = useTestAuthUser()

    it("returns 401 without Authorization", async () => {
        const res = await request(app.express).get(
            `/api/v1/organizations/${authUser.auth.organizationId}/projects`,
        )
        expect(res.status).toBe(401)
    })

    it("creates, lists, gets, updates, and deletes a project", async () => {
        const { organizationId } = authUser.auth

        const createRes = await request(app.express)
            .post(`/api/v1/organizations/${organizationId}/projects`)
            .set(authUser.headers())
            .send({
                name: "Test Project",
                description: "Integration test",
                environment: "DEVELOPMENT",
            })

        expect(createRes.status).toBe(201)
        expect(createRes.body.data).toMatchObject({
            name: "Test Project",
            description: "Integration test",
            environment: "DEVELOPMENT",
            status: "ACTIVE",
            organizationId,
        })

        const projectId = createRes.body.data.id as string

        const listRes = await request(app.express)
            .get(`/api/v1/organizations/${organizationId}/projects`)
            .set(authUser.headers())
        expect(listRes.status).toBe(200)
        expect(listRes.body.data.some((p: { id: string }) => p.id === projectId)).toBe(true)

        const getRes = await request(app.express)
            .get(`/api/v1/projects/${projectId}`)
            .set(authUser.headers())
        expect(getRes.status).toBe(200)
        expect(getRes.body.data.id).toBe(projectId)

        const patchRes = await request(app.express)
            .patch(`/api/v1/projects/${projectId}`)
            .set(authUser.headers())
            .send({ name: "Renamed Project", status: "ARCHIVED" })
        expect(patchRes.status).toBe(200)
        expect(patchRes.body.data).toMatchObject({
            name: "Renamed Project",
            status: "ARCHIVED",
        })

        const deleteRes = await request(app.express)
            .delete(`/api/v1/projects/${projectId}`)
            .set(authUser.headers())
        expect(deleteRes.status).toBe(200)
        expect(deleteRes.body.data).toEqual({ deleted: true })

        const missingRes = await request(app.express)
            .get(`/api/v1/projects/${projectId}`)
            .set(authUser.headers())
        expect(missingRes.status).toBe(404)
    })

    it("rejects invalid create body", async () => {
        const res = await request(app.express)
            .post(`/api/v1/organizations/${authUser.auth.organizationId}/projects`)
            .set(authUser.headers())
            .send({ name: "", environment: "DEVELOPMENT" })

        expect(res.status).toBe(400)
        expect(res.body.error.code).toBe("VALIDATION_ERROR")
    })
})
