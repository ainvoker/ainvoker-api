import request from "supertest"
import { describe, expect, it } from "vitest"
import app from "../../src/app.js"
import { ensureTextCatalog } from "../../src/modules/text/catalog.js"
import apiKeyHasher from "../../src/platform/hash.js"
import prismaClient from "../../src/platform/prisma.js"
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

    it("deactivates and reactivates a project", async () => {
        const { organizationId } = authUser.auth

        const createRes = await request(app.express)
            .post(`/api/v1/organizations/${organizationId}/projects`)
            .set(authUser.headers())
            .send({
                name: `Deactivate Project ${authUser.auth.userId.slice(-8)}`,
                environment: "STAGING",
            })
        expect(createRes.status).toBe(201)
        const projectId = createRes.body.data.id as string

        const disableRes = await request(app.express)
            .patch(`/api/v1/projects/${projectId}`)
            .set(authUser.headers())
            .send({ status: "DISABLED" })
        expect(disableRes.status).toBe(200)
        expect(disableRes.body.data.status).toBe("DISABLED")

        const enableRes = await request(app.express)
            .patch(`/api/v1/projects/${projectId}`)
            .set(authUser.headers())
            .send({ status: "ACTIVE" })
        expect(enableRes.status).toBe(200)
        expect(enableRes.body.data.status).toBe("ACTIVE")
    })

    it("deletes a project that has an API key and AI request history", async () => {
        await ensureTextCatalog()

        const project = await prismaClient.project.create({
            data: {
                organizationId: authUser.auth.organizationId,
                name: `Keyed Project ${authUser.auth.userId.slice(-8)}`,
                environment: "DEVELOPMENT",
            },
        })

        const generated = apiKeyHasher.generate()
        const key = await prismaClient.apiKey.create({
            data: {
                projectId: project.id,
                keyName: "Delete Fixture Key",
                keyHash: generated.keyHash,
                keyPrefix: generated.keyPrefix,
                status: "ACTIVE",
            },
        })

        const model = await prismaClient.aIModel.findFirstOrThrow({
            where: { name: "gemini-3.6-flash", provider: { name: "gemini" } },
        })

        const action = await prismaClient.action.create({
            data: {
                projectId: project.id,
                name: "fixture_action",
                inputSchema: { type: "object" },
            },
        })

        const aiRequest = await prismaClient.aIRequest.create({
            data: {
                projectId: project.id,
                apiKeyId: key.id,
                modelId: model.id,
                serviceType: "TEXT",
                requestStatus: "SUCCESS",
                requestPayload: { messages: [{ role: "user", content: "Hi" }] },
                responsePayload: { message: { role: "assistant", content: "Hello" } },
                inputTokens: 1,
                outputTokens: 1,
                totalTokens: 2,
            },
        })

        await prismaClient.actionInvocation.create({
            data: {
                requestId: aiRequest.id,
                actionId: action.id,
                executionStatus: "REPORTED_SUCCESS",
            },
        })

        const deleteRes = await request(app.express)
            .delete(`/api/v1/projects/${project.id}`)
            .set(authUser.headers())
        expect(deleteRes.status).toBe(200)
        expect(deleteRes.body.data).toEqual({ deleted: true })

        const missing = await prismaClient.project.findUnique({ where: { id: project.id } })
        expect(missing).toBeNull()

        const leftoverKeys = await prismaClient.apiKey.count({ where: { projectId: project.id } })
        expect(leftoverKeys).toBe(0)
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
