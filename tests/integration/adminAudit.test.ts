import request from "supertest"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import app from "../../src/app.js"
import env from "../../src/config/env.js"
import { AUDIT_ACTIONS } from "../../src/modules/audit/actions.js"
import prismaClient from "../../src/platform/prisma.js"
import { useTestAuthUser } from "../helpers/fixtures.js"

describe("admin audit endpoints", () => {
    const authUser = useTestAuthUser({
        profile: {
            email: "admin-audit@example.com",
            firstName: "Admin",
            lastName: "Audit",
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

    it("returns 401 without Authorization", async () => {
        const res = await request(app.express).get("/api/v1/admin/audit-events")
        expect(res.status).toBe(401)
    })

    it("returns 403 for users who are not platform admins", async () => {
        vi.spyOn(env, "isPlatformAdmin").mockReturnValue(false)
        const res = await request(app.express)
            .get("/api/v1/admin/audit-events")
            .set(authUser.headers())
        expect(res.status).toBe(403)
        expect(res.body.error.code).toBe("FORBIDDEN")
    })

    it("records an audit event when suspending an organization and lists it", async () => {
        const suspend = await request(app.express)
            .patch(`/api/v1/admin/organizations/${authUser.auth.organizationId}`)
            .set(authUser.headers())
            .send({ status: "SUSPENDED" })
        expect(suspend.status).toBe(200)

        const listed = await request(app.express)
            .get("/api/v1/admin/audit-events")
            .query({ action: AUDIT_ACTIONS.organizationSuspended, organizationId: authUser.auth.organizationId })
            .set(authUser.headers())
        expect(listed.status).toBe(200)
        expect(listed.body.data.total).toBeGreaterThanOrEqual(1)

        const event = (listed.body.data.items as Array<{
            action: string
            actorType: string
            actorUserId: string | null
            organizationId: string | null
            targetId: string | null
            summary: string
        }>).find((row) => row.action === AUDIT_ACTIONS.organizationSuspended)

        expect(event).toMatchObject({
            action: AUDIT_ACTIONS.organizationSuspended,
            actorType: "PLATFORM_ADMIN",
            actorUserId: authUser.auth.userId,
            organizationId: authUser.auth.organizationId,
            targetId: authUser.auth.organizationId,
        })
        expect(event?.summary.toLowerCase()).toContain("suspend")

        const stored = await prismaClient.auditEvent.findFirst({
            where: {
                action: AUDIT_ACTIONS.organizationSuspended,
                organizationId: authUser.auth.organizationId,
            },
            orderBy: { createdAt: "desc" },
        })
        expect(stored).toBeTruthy()

        // Restore so other tests are not left with a suspended org from this fixture user.
        await request(app.express)
            .patch(`/api/v1/admin/organizations/${authUser.auth.organizationId}`)
            .set(authUser.headers())
            .send({ status: "ACTIVE" })
    })
})
