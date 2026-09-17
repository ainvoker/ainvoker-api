import request from "supertest"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import app from "../../src/app.js"
import { PLAN_NAMES } from "../../src/modules/billing/catalog.js"
import { hashInviteToken, INVITE_TTL_MS } from "../../src/modules/members/token.js"
import prismaClient from "../../src/platform/prisma.js"
import { authHeader } from "../helpers/auth.js"
import {
    cleanupTestUser,
    seedUserWithPersonalOrg,
    testUserId,
    type SeededAuthUser,
} from "../helpers/db.js"
import { useTestAuthUser } from "../helpers/fixtures.js"

async function createTeamOrg(headers: Record<string, string>, name: string) {
    const res = await request(app.express)
        .post("/api/v1/organizations")
        .set(headers)
        .send({ name, plan: PLAN_NAMES.pro })
    expect(res.status).toBe(201)
    return res.body.data.id as string
}

describe("Members / invites", () => {
    const authUser = useTestAuthUser({
        profile: { email: "owner@example.com", firstName: "Owner", lastName: "User" },
    })

    let invitee: SeededAuthUser | null = null
    let adminUser: SeededAuthUser | null = null

    beforeEach(async () => {
        invitee = await seedUserWithPersonalOrg(testUserId(), {
            email: "invitee@example.com",
            firstName: "Invite",
            lastName: "Ee",
        })
        adminUser = await seedUserWithPersonalOrg(testUserId(), {
            email: "admin@example.com",
            firstName: "Admin",
            lastName: "User",
        })
    })

    afterEach(async () => {
        if (invitee) {
            await cleanupTestUser(invitee.userId)
            invitee = null
        }
        if (adminUser) {
            await cleanupTestUser(adminUser.userId)
            adminUser = null
        }
    })

    it("returns 401 without Authorization on members list", async () => {
        const orgId = await createTeamOrg(
            authUser.headers(),
            `Team ${authUser.auth.userId.slice(-6)}`,
        )
        const res = await request(app.express).get(`/api/v1/organizations/${orgId}/members`)
        expect(res.status).toBe(401)
        expect(res.body.error.code).toBe("UNAUTHORIZED")
    })

    it("returns 403 for personal workspace member management", async () => {
        const personalId = authUser.auth.organizationId

        const list = await request(app.express)
            .get(`/api/v1/organizations/${personalId}/members`)
            .set(authUser.headers())
        expect(list.status).toBe(403)
        expect(list.body.error.code).toBe("FORBIDDEN")

        const invite = await request(app.express)
            .post(`/api/v1/organizations/${personalId}/invites`)
            .set(authUser.headers())
            .send({ email: "someone@example.com", role: "member" })
        expect(invite.status).toBe(403)
    })

    it("lists members for any member of a non-personal org", async () => {
        const orgId = await createTeamOrg(
            authUser.headers(),
            `List ${authUser.auth.userId.slice(-6)}`,
        )

        const created = await request(app.express)
            .post(`/api/v1/organizations/${orgId}/invites`)
            .set(authUser.headers())
            .send({ email: "invitee@example.com", role: "member" })
        expect(created.status).toBe(201)
        const token = created.body.data.token as string

        const accepted = await request(app.express)
            .post("/api/v1/invites/accept")
            .set(authHeader(invitee!.userId))
            .send({ token })
        expect(accepted.status).toBe(200)

        const list = await request(app.express)
            .get(`/api/v1/organizations/${orgId}/members`)
            .set(authHeader(invitee!.userId))
        expect(list.status).toBe(200)
        expect(list.body.data.length).toBe(2)
        expect(list.body.data.map((m: { role: string }) => m.role).sort()).toEqual([
            "member",
            "owner",
        ])
    })

    it("creates, lists, and revokes invites", async () => {
        const orgId = await createTeamOrg(
            authUser.headers(),
            `Invite ${authUser.auth.userId.slice(-6)}`,
        )

        const created = await request(app.express)
            .post(`/api/v1/organizations/${orgId}/invites`)
            .set(authUser.headers())
            .send({ email: "newperson@example.com", role: "admin" })
        expect(created.status).toBe(201)
        expect(created.body.data).toMatchObject({
            email: "newperson@example.com",
            role: "admin",
            status: "PENDING",
        })
        expect(created.body.data.token).toBeTruthy()
        expect(created.body.data.acceptUrl).toContain("/invites/accept?token=")

        const listed = await request(app.express)
            .get(`/api/v1/organizations/${orgId}/invites`)
            .set(authUser.headers())
        expect(listed.status).toBe(200)
        expect(listed.body.data).toHaveLength(1)
        expect(listed.body.data[0].token).toBeUndefined()

        const revoked = await request(app.express)
            .delete(`/api/v1/organizations/${orgId}/invites/${created.body.data.id}`)
            .set(authUser.headers())
        expect(revoked.status).toBe(200)
        expect(revoked.body.data.deleted).toBe(true)

        const listedAfter = await request(app.express)
            .get(`/api/v1/organizations/${orgId}/invites`)
            .set(authUser.headers())
        expect(listedAfter.body.data).toHaveLength(0)
    })

    it("rejects duplicate pending invite for same email", async () => {
        const orgId = await createTeamOrg(
            authUser.headers(),
            `Dup ${authUser.auth.userId.slice(-6)}`,
        )

        const first = await request(app.express)
            .post(`/api/v1/organizations/${orgId}/invites`)
            .set(authUser.headers())
            .send({ email: "dup@example.com", role: "member" })
        expect(first.status).toBe(201)

        const second = await request(app.express)
            .post(`/api/v1/organizations/${orgId}/invites`)
            .set(authUser.headers())
            .send({ email: "DUP@example.com", role: "admin" })
        expect(second.status).toBe(409)
        expect(second.body.error.code).toBe("CONFLICT")
    })

    it("accepts invite happy path and rejects email mismatch / duplicate", async () => {
        const orgId = await createTeamOrg(
            authUser.headers(),
            `Accept ${authUser.auth.userId.slice(-6)}`,
        )

        const created = await request(app.express)
            .post(`/api/v1/organizations/${orgId}/invites`)
            .set(authUser.headers())
            .send({ email: "invitee@example.com", role: "member" })
        expect(created.status).toBe(201)
        const token = created.body.data.token as string

        const preview = await request(app.express)
            .get("/api/v1/invites/preview")
            .query({ token })
        expect(preview.status).toBe(200)
        expect(preview.body.data).toMatchObject({
            email: "invitee@example.com",
            role: "member",
            status: "PENDING",
        })

        const mismatch = await request(app.express)
            .post("/api/v1/invites/accept")
            .set(authHeader(adminUser!.userId))
            .send({ token })
        expect(mismatch.status).toBe(403)
        expect(mismatch.body.error.code).toBe("FORBIDDEN")

        const accepted = await request(app.express)
            .post("/api/v1/invites/accept")
            .set(authHeader(invitee!.userId))
            .send({ token })
        expect(accepted.status).toBe(200)
        expect(accepted.body.data.organization.id).toBe(orgId)
        expect(accepted.body.data.membership.role).toBe("member")

        const duplicate = await request(app.express)
            .post("/api/v1/invites/accept")
            .set(authHeader(invitee!.userId))
            .send({ token })
        expect(duplicate.status).toBe(409)
    })

    it("rejects expired invite with INVITE_EXPIRED", async () => {
        const orgId = await createTeamOrg(
            authUser.headers(),
            `Expired ${authUser.auth.userId.slice(-6)}`,
        )

        const created = await request(app.express)
            .post(`/api/v1/organizations/${orgId}/invites`)
            .set(authUser.headers())
            .send({ email: "invitee@example.com", role: "member" })
        expect(created.status).toBe(201)
        const token = created.body.data.token as string
        const inviteId = created.body.data.id as string

        await prismaClient.organizationInvite.update({
            where: { id: inviteId },
            data: { expiresAt: new Date(Date.now() - 60_000) },
        })

        const res = await request(app.express)
            .post("/api/v1/invites/accept")
            .set(authHeader(invitee!.userId))
            .send({ token })
        expect(res.status).toBe(410)
        expect(res.body.error.code).toBe("INVITE_EXPIRED")
    })

    it("enforces role change matrix and transfer ownership", async () => {
        const orgId = await createTeamOrg(
            authUser.headers(),
            `Roles ${authUser.auth.userId.slice(-6)}`,
        )

        // Invite admin and member
        const adminInvite = await request(app.express)
            .post(`/api/v1/organizations/${orgId}/invites`)
            .set(authUser.headers())
            .send({ email: "admin@example.com", role: "admin" })
        expect(adminInvite.status).toBe(201)
        await request(app.express)
            .post("/api/v1/invites/accept")
            .set(authHeader(adminUser!.userId))
            .send({ token: adminInvite.body.data.token })

        const memberInvite = await request(app.express)
            .post(`/api/v1/organizations/${orgId}/invites`)
            .set(authUser.headers())
            .send({ email: "invitee@example.com", role: "member" })
        expect(memberInvite.status).toBe(201)
        await request(app.express)
            .post("/api/v1/invites/accept")
            .set(authHeader(invitee!.userId))
            .send({ token: memberInvite.body.data.token })

        const members = await request(app.express)
            .get(`/api/v1/organizations/${orgId}/members`)
            .set(authUser.headers())
        expect(members.status).toBe(200)

        const adminMembership = members.body.data.find(
            (m: { user: { id: string } }) => m.user.id === adminUser!.userId,
        )
        const memberMembership = members.body.data.find(
            (m: { user: { id: string } }) => m.user.id === invitee!.userId,
        )
        const ownerMembership = members.body.data.find(
            (m: { user: { id: string } }) => m.user.id === authUser.auth.userId,
        )
        expect(adminMembership).toBeTruthy()
        expect(memberMembership).toBeTruthy()
        expect(ownerMembership).toBeTruthy()

        // Admin cannot promote to owner
        const promote = await request(app.express)
            .patch(`/api/v1/organizations/${orgId}/members/${memberMembership.id}`)
            .set(authHeader(adminUser!.userId))
            .send({ role: "owner" })
        expect(promote.status).toBe(403)

        // Admin can change member ↔ admin
        const toAdmin = await request(app.express)
            .patch(`/api/v1/organizations/${orgId}/members/${memberMembership.id}`)
            .set(authHeader(adminUser!.userId))
            .send({ role: "admin" })
        expect(toAdmin.status).toBe(200)
        expect(toAdmin.body.data.role).toBe("admin")

        // Cannot change own role
        const selfChange = await request(app.express)
            .patch(`/api/v1/organizations/${orgId}/members/${adminMembership.id}`)
            .set(authHeader(adminUser!.userId))
            .send({ role: "member" })
        expect(selfChange.status).toBe(403)

        // Owner transfers ownership
        const transfer = await request(app.express)
            .post(`/api/v1/organizations/${orgId}/transfer-ownership`)
            .set(authUser.headers())
            .send({ memberId: adminMembership.id })
        expect(transfer.status).toBe(200)
        expect(transfer.body.data.role).toBe("owner")
        expect(transfer.body.data.user.id).toBe(adminUser!.userId)

        const after = await request(app.express)
            .get(`/api/v1/organizations/${orgId}/members`)
            .set(authHeader(adminUser!.userId))
        const formerOwner = after.body.data.find(
            (m: { user: { id: string } }) => m.user.id === authUser.auth.userId,
        )
        expect(formerOwner.role).toBe("admin")
    })

    it("cannot remove last owner; owner cannot leave without transfer", async () => {
        const orgId = await createTeamOrg(
            authUser.headers(),
            `Leave ${authUser.auth.userId.slice(-6)}`,
        )

        const members = await request(app.express)
            .get(`/api/v1/organizations/${orgId}/members`)
            .set(authUser.headers())
        const ownerMembership = members.body.data[0]

        const removeOwner = await request(app.express)
            .delete(`/api/v1/organizations/${orgId}/members/${ownerMembership.id}`)
            .set(authUser.headers())
        expect(removeOwner.status).toBe(403)

        const leave = await request(app.express)
            .post(`/api/v1/organizations/${orgId}/leave`)
            .set(authUser.headers())
        expect(leave.status).toBe(403)
        expect(leave.body.error.message).toMatch(/transfer ownership/i)
    })

    it("allows member leave and admin remove of non-owners", async () => {
        const orgId = await createTeamOrg(
            authUser.headers(),
            `Remove ${authUser.auth.userId.slice(-6)}`,
        )

        const memberInvite = await request(app.express)
            .post(`/api/v1/organizations/${orgId}/invites`)
            .set(authUser.headers())
            .send({ email: "invitee@example.com", role: "member" })
        await request(app.express)
            .post("/api/v1/invites/accept")
            .set(authHeader(invitee!.userId))
            .send({ token: memberInvite.body.data.token })

        const adminInvite = await request(app.express)
            .post(`/api/v1/organizations/${orgId}/invites`)
            .set(authUser.headers())
            .send({ email: "admin@example.com", role: "admin" })
        await request(app.express)
            .post("/api/v1/invites/accept")
            .set(authHeader(adminUser!.userId))
            .send({ token: adminInvite.body.data.token })

        const left = await request(app.express)
            .post(`/api/v1/organizations/${orgId}/leave`)
            .set(authHeader(invitee!.userId))
        expect(left.status).toBe(200)

        // Re-invite member for remove test
        const reinvite = await request(app.express)
            .post(`/api/v1/organizations/${orgId}/invites`)
            .set(authUser.headers())
            .send({ email: "invitee@example.com", role: "member" })
        await request(app.express)
            .post("/api/v1/invites/accept")
            .set(authHeader(invitee!.userId))
            .send({ token: reinvite.body.data.token })

        const members = await request(app.express)
            .get(`/api/v1/organizations/${orgId}/members`)
            .set(authUser.headers())
        const memberMembership = members.body.data.find(
            (m: { user: { id: string } }) => m.user.id === invitee!.userId,
        )

        const removed = await request(app.express)
            .delete(`/api/v1/organizations/${orgId}/members/${memberMembership.id}`)
            .set(authHeader(adminUser!.userId))
        expect(removed.status).toBe(200)
        expect(removed.body.data.deleted).toBe(true)
    })

    it("resends invite with a new token", async () => {
        const orgId = await createTeamOrg(
            authUser.headers(),
            `Resend ${authUser.auth.userId.slice(-6)}`,
        )

        const created = await request(app.express)
            .post(`/api/v1/organizations/${orgId}/invites`)
            .set(authUser.headers())
            .send({ email: "invitee@example.com", role: "member" })
        const oldToken = created.body.data.token as string
        const inviteId = created.body.data.id as string

        const resent = await request(app.express)
            .post(`/api/v1/organizations/${orgId}/invites/${inviteId}/resend`)
            .set(authUser.headers())
        expect(resent.status).toBe(200)
        expect(resent.body.data.token).toBeTruthy()
        expect(resent.body.data.token).not.toBe(oldToken)

        const oldHash = hashInviteToken(oldToken)
        const row = await prismaClient.organizationInvite.findUniqueOrThrow({
            where: { id: inviteId },
        })
        expect(row.tokenHash).not.toBe(oldHash)
        expect(row.expiresAt.getTime()).toBeGreaterThan(Date.now() + INVITE_TTL_MS - 60_000)

        const accepted = await request(app.express)
            .post("/api/v1/invites/accept")
            .set(authHeader(invitee!.userId))
            .send({ token: resent.body.data.token })
        expect(accepted.status).toBe(200)
    })
})
