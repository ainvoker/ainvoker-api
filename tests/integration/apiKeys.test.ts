import request from "supertest"
import { beforeEach, describe, expect, it } from "vitest"
import app from "../../src/app.js"
import prismaClient from "../../src/platform/prisma.js"
import { useTestAuthUser } from "../helpers/fixtures.js"

describe("api keys endpoints", () => {
    const authUser = useTestAuthUser()
    let projectId = ""

    beforeEach(async () => {
        const project = await prismaClient.project.create({
            data: {
                organizationId: authUser.auth.organizationId,
                name: `Keys Project ${authUser.auth.userId.slice(-8)}`,
                environment: "DEVELOPMENT",
            },
        })
        projectId = project.id
    })

    it("returns 401 without Authorization", async () => {
        const res = await request(app.express).get(`/api/v1/projects/${projectId}/api-keys`)
        expect(res.status).toBe(401)
    })

    it("creates, lists, revokes, and deletes an api key", async () => {
        const createRes = await request(app.express)
            .post(`/api/v1/projects/${projectId}/api-keys`)
            .set(authUser.headers())
            .send({ keyName: "Test Key" })

        expect(createRes.status).toBe(201)
        expect(createRes.body.data).toMatchObject({
            projectId,
            keyName: "Test Key",
            status: "ACTIVE",
            clientType: "SERVER",
        })
        expect(createRes.body.data.apiKey).toMatch(/^ain_/)
        expect(createRes.body.data.keyPrefix).toBe(createRes.body.data.apiKey.slice(0, 12))

        const keyId = createRes.body.data.id as string

        const listRes = await request(app.express)
            .get(`/api/v1/projects/${projectId}/api-keys`)
            .set(authUser.headers())
        expect(listRes.status).toBe(200)
        expect(listRes.body.data.some((k: { id: string }) => k.id === keyId)).toBe(true)
        expect(listRes.body.data[0].apiKey).toBeUndefined()

        const revokeRes = await request(app.express)
            .post(`/api/v1/projects/${projectId}/api-keys/${keyId}/revoke`)
            .set(authUser.headers())
        expect(revokeRes.status).toBe(200)
        expect(revokeRes.body.data.status).toBe("REVOKED")

        const deleteRes = await request(app.express)
            .delete(`/api/v1/projects/${projectId}/api-keys/${keyId}`)
            .set(authUser.headers())
        expect(deleteRes.status).toBe(200)
        expect(deleteRes.body.data).toEqual({ deleted: true })

        const listAfter = await request(app.express)
            .get(`/api/v1/projects/${projectId}/api-keys`)
            .set(authUser.headers())
        expect(listAfter.body.data.some((k: { id: string }) => k.id === keyId)).toBe(false)
    })

    it("rejects an expiry in the past", async () => {
        const res = await request(app.express)
            .post(`/api/v1/projects/${projectId}/api-keys`)
            .set(authUser.headers())
            .send({ keyName: "Old", expiresAt: new Date(Date.now() - 60_000).toISOString() })

        expect(res.status).toBe(400)
        expect(res.body.error.code).toBe("VALIDATION_ERROR")
    })

    it("refuses a browser key until the project has an allowed origin", async () => {
        const blocked = await request(app.express)
            .post(`/api/v1/projects/${projectId}/api-keys`)
            .set(authUser.headers())
            .send({ keyName: "Web", clientType: "BROWSER" })
        expect(blocked.status).toBe(400)
        expect(blocked.body.error.code).toBe("NO_ALLOWED_ORIGINS")

        await prismaClient.projectAllowedOrigin.create({
            data: { projectId, origin: "https://app.example.com" },
        })

        const created = await request(app.express)
            .post(`/api/v1/projects/${projectId}/api-keys`)
            .set(authUser.headers())
            .send({ keyName: "Web", clientType: "BROWSER" })
        expect(created.status).toBe(201)
        expect(created.body.data.clientType).toBe("BROWSER")
    })

    describe("capabilities", () => {
        async function createKey(body: Record<string, unknown>) {
            const res = await request(app.express)
                .post(`/api/v1/projects/${projectId}/api-keys`)
                .set(authUser.headers())
                .send({ keyName: "Scoped", ...body })
            expect(res.status).toBe(201)
            return res.body.data as { id: string; apiKey: string; permissions: unknown }
        }

        // Empty bodies fail validation after the scope check, so a 400 proves the scope passed.
        function callGateway(path: string, apiKey: string) {
            return request(app.express)
                .post(path)
                .set({ Authorization: `Bearer ${apiKey}` })
                .send({})
        }

        it("rejects an empty scope list", async () => {
            const res = await request(app.express)
                .post(`/api/v1/projects/${projectId}/api-keys`)
                .set(authUser.headers())
                .send({ keyName: "None", permissions: { scopes: [] } })
            expect(res.status).toBe(400)
        })

        it("denies image calls for a text-only key", async () => {
            const key = await createKey({ permissions: { scopes: ["text"] } })
            expect(key.permissions).toEqual({ scopes: ["text"] })

            const image = await callGateway("/v1/image/generate", key.apiKey)
            expect(image.status).toBe(403)
            expect(image.body.error.code).toBe("API_KEY_SCOPE_DENIED")

            const text = await callGateway("/v1/text/chat", key.apiKey)
            expect(text.status).toBe(400)
        })

        it("denies text chat and stream for an image-only key", async () => {
            const key = await createKey({ permissions: { scopes: ["image"] } })

            for (const path of ["/v1/text/chat", "/v1/text/stream"]) {
                const res = await callGateway(path, key.apiKey)
                expect(res.status).toBe(403)
                expect(res.body.error.code).toBe("API_KEY_SCOPE_DENIED")
            }
        })

        it("allows chat but not stream for a text.chat key", async () => {
            const key = await createKey({ permissions: { scopes: ["text.chat"] } })

            const chat = await callGateway("/v1/text/chat", key.apiKey)
            expect(chat.status).toBe(400)

            const stream = await callGateway("/v1/text/stream", key.apiKey)
            expect(stream.status).toBe(403)
            expect(stream.body.error.code).toBe("API_KEY_SCOPE_DENIED")
        })

        it("stores every feature of a category as the category", async () => {
            const key = await createKey({ permissions: { scopes: ["text.stream", "text.chat"] } })
            expect(key.permissions).toEqual({ scopes: ["text"] })
        })

        it("updates capabilities on an active key and applies them on the next request", async () => {
            const key = await createKey({ permissions: { scopes: ["image"] } })

            const patchRes = await request(app.express)
                .patch(`/api/v1/projects/${projectId}/api-keys/${key.id}`)
                .set(authUser.headers())
                .send({ permissions: null })
            expect(patchRes.status).toBe(200)
            expect(patchRes.body.data.permissions).toBeNull()

            const text = await callGateway("/v1/text/chat", key.apiKey)
            expect(text.status).toBe(400)
        })

        it("refuses to update a revoked key", async () => {
            const key = await createKey({})
            await request(app.express)
                .post(`/api/v1/projects/${projectId}/api-keys/${key.id}/revoke`)
                .set(authUser.headers())

            const res = await request(app.express)
                .patch(`/api/v1/projects/${projectId}/api-keys/${key.id}`)
                .set(authUser.headers())
                .send({ permissions: { scopes: ["text"] } })
            expect(res.status).toBe(409)
            expect(res.body.error.code).toBe("KEY_NOT_ACTIVE")
        })
    })
})
