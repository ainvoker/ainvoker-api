import request from "supertest"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import app from "../../src/app.js"
import env from "../../src/config/env.js"
import { AUDIT_ACTIONS } from "../../src/modules/audit/actions.js"
import prismaClient from "../../src/platform/prisma.js"
import { useTestAuthUser } from "../helpers/fixtures.js"

describe("admin safety endpoints", () => {
    const authUser = useTestAuthUser({
        profile: {
            email: "admin-safety@example.com",
            firstName: "Admin",
            lastName: "Safety",
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

    async function seedProjectAndKey(opts?: { keyName?: string; projectName?: string }) {
        const project = await prismaClient.project.create({
            data: {
                organizationId: authUser.auth.organizationId,
                name: opts?.projectName ?? `Safety Project ${authUser.auth.userId.slice(-8)}`,
                environment: "DEVELOPMENT",
            },
        })
        const key = await prismaClient.apiKey.create({
            data: {
                projectId: project.id,
                keyName: opts?.keyName ?? "Safety Key",
                keyHash: `hash-safety-${authUser.auth.userId}`,
                keyPrefix: "ain_safety1",
                status: "ACTIVE",
                clientType: "SERVER",
            },
        })
        return { project, key }
    }

    it("returns 401 without Authorization", async () => {
        const res = await request(app.express).get("/api/v1/admin/api-keys")
        expect(res.status).toBe(401)
    })

    it("returns 403 for users who are not platform admins", async () => {
        vi.spyOn(env, "isPlatformAdmin").mockReturnValue(false)
        const res = await request(app.express)
            .get("/api/v1/admin/api-keys")
            .set(authUser.headers())
        expect(res.status).toBe(403)
        expect(res.body.error.code).toBe("FORBIDDEN")
    })

    it("lists API keys with search and status filters", async () => {
        const { key, project } = await seedProjectAndKey({ keyName: "Findable Key" })

        const listed = await request(app.express)
            .get("/api/v1/admin/api-keys")
            .query({ q: "Findable", status: "ACTIVE" })
            .set(authUser.headers())
        expect(listed.status).toBe(200)
        expect(listed.body.data.total).toBeGreaterThanOrEqual(1)
        expect(listed.body.data.items).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: key.id,
                    keyName: "Findable Key",
                    keyPrefix: "ain_safety1",
                    status: "ACTIVE",
                    projectId: project.id,
                    organizationId: authUser.auth.organizationId,
                }),
            ]),
        )
    })

    it("force-revokes an API key and writes an audit event", async () => {
        const { key } = await seedProjectAndKey()

        const revoked = await request(app.express)
            .post(`/api/v1/admin/api-keys/${key.id}/revoke`)
            .set(authUser.headers())
        expect(revoked.status).toBe(200)
        expect(revoked.body.data).toMatchObject({
            id: key.id,
            status: "REVOKED",
            organizationId: authUser.auth.organizationId,
        })

        const stored = await prismaClient.apiKey.findUniqueOrThrow({ where: { id: key.id } })
        expect(stored.status).toBe("REVOKED")

        const audit = await prismaClient.auditEvent.findFirst({
            where: {
                action: AUDIT_ACTIONS.apiKeyRevoked,
                targetId: key.id,
            },
            orderBy: { createdAt: "desc" },
        })
        expect(audit).toMatchObject({
            actorType: "PLATFORM_ADMIN",
            actorUserId: authUser.auth.userId,
            organizationId: authUser.auth.organizationId,
            targetType: "api_key",
        })

        // Idempotent second revoke
        const again = await request(app.express)
            .post(`/api/v1/admin/api-keys/${key.id}/revoke`)
            .set(authUser.headers())
        expect(again.status).toBe(200)
        expect(again.body.data.status).toBe("REVOKED")
    })

    it("lists projects and disables then re-enables with audit", async () => {
        const { project } = await seedProjectAndKey({ projectName: "Disable Me" })

        const listed = await request(app.express)
            .get("/api/v1/admin/projects")
            .query({ q: "Disable Me", status: "ACTIVE" })
            .set(authUser.headers())
        expect(listed.status).toBe(200)
        expect(listed.body.data.items).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: project.id,
                    name: "Disable Me",
                    status: "ACTIVE",
                    organizationId: authUser.auth.organizationId,
                    apiKeyCount: 1,
                }),
            ]),
        )

        const disabled = await request(app.express)
            .patch(`/api/v1/admin/projects/${project.id}`)
            .set(authUser.headers())
            .send({ status: "DISABLED" })
        expect(disabled.status).toBe(200)
        expect(disabled.body.data.status).toBe("DISABLED")

        const disableAudit = await prismaClient.auditEvent.findFirst({
            where: {
                action: AUDIT_ACTIONS.projectDisabled,
                targetId: project.id,
            },
            orderBy: { createdAt: "desc" },
        })
        expect(disableAudit).toMatchObject({
            actorType: "PLATFORM_ADMIN",
            actorUserId: authUser.auth.userId,
            organizationId: authUser.auth.organizationId,
        })

        const reenabled = await request(app.express)
            .patch(`/api/v1/admin/projects/${project.id}`)
            .set(authUser.headers())
            .send({ status: "ACTIVE" })
        expect(reenabled.status).toBe(200)
        expect(reenabled.body.data.status).toBe("ACTIVE")

        const reenableAudit = await prismaClient.auditEvent.findFirst({
            where: {
                action: AUDIT_ACTIONS.projectReenabled,
                targetId: project.id,
            },
            orderBy: { createdAt: "desc" },
        })
        expect(reenableAudit).toBeTruthy()
    })

    it("returns 404 for unknown key or project", async () => {
        const revoke = await request(app.express)
            .post("/api/v1/admin/api-keys/missing-key/revoke")
            .set(authUser.headers())
        expect(revoke.status).toBe(404)

        const patch = await request(app.express)
            .patch("/api/v1/admin/projects/missing-project")
            .set(authUser.headers())
            .send({ status: "DISABLED" })
        expect(patch.status).toBe(404)
    })
})
