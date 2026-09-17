import { Prisma } from "../../generated/prisma/client.js"
import env from "../../config/env.js"
import { AppError } from "../../platform/errors.js"
import prismaClient from "../../platform/prisma.js"
import {
    isPersonalOrganizationSlug,
} from "../organizations/service.js"
import organizationsService from "../organizations/service.js"
import type { z } from "zod"
import type {
    createInviteSchema,
    transferOwnershipSchema,
    updateMemberRoleSchema,
} from "./schemas.js"
import { generateInviteToken, hashInviteToken, INVITE_TTL_MS } from "./token.js"

const TEAM_MANAGER_ROLES = new Set(["owner", "admin"])
const INVITE_ROLES = new Set(["admin", "member"])

type RoleName = "owner" | "admin" | "member"

type UserSummary = {
    id: string
    email: string | null
    firstName: string | null
    lastName: string | null
    profilePicture: string | null
}

type InviteWithRelations = {
    id: string
    email: string
    status: string
    expiresAt: Date
    createdAt: Date
    role: { name: string }
    invitedBy: UserSummary
}

class MembersService {
    private async getRoleByName(name: RoleName) {
        await organizationsService.ensureRoles()
        const role = await prismaClient.role.findUnique({ where: { name } })
        if (!role) {
            throw new AppError(500, "INTERNAL_ERROR", `Role "${name}" is not configured`)
        }
        return role
    }

    private async assertNonPersonalOrg(organizationId: string) {
        const organization = await prismaClient.organization.findUnique({
            where: { id: organizationId },
        })
        if (!organization || organization.status === "DELETED") {
            throw new AppError(404, "NOT_FOUND", "Organization not found")
        }
        if (isPersonalOrganizationSlug(organization.slug)) {
            throw new AppError(
                403,
                "FORBIDDEN",
                "Team management is not available on Personal workspaces",
            )
        }
        return organization
    }

    private requireManager(roleName: string) {
        if (!TEAM_MANAGER_ROLES.has(roleName)) {
            throw new AppError(
                403,
                "FORBIDDEN",
                "Only workspace owners and admins can manage team members",
            )
        }
    }

    private requireOwner(roleName: string) {
        if (roleName !== "owner") {
            throw new AppError(403, "FORBIDDEN", "Only the workspace owner can perform this action")
        }
    }

    private buildAcceptUrl(token: string) {
        return `${env.getClientOrigin()}/invites/accept?token=${encodeURIComponent(token)}`
    }

    private serializeUser(user: UserSummary) {
        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            profilePicture: user.profilePicture,
        }
    }

    private serializeMember(row: {
        id: string
        createdAt: Date
        role: { name: string }
        user: UserSummary
    }) {
        return {
            id: row.id,
            role: row.role.name as RoleName,
            createdAt: row.createdAt.toISOString(),
            user: this.serializeUser(row.user),
        }
    }

    private serializeInvite(
        row: InviteWithRelations,
        secrets?: { token: string; acceptUrl: string },
    ) {
        const expired = row.expiresAt.getTime() < Date.now()
        const status =
            row.status === "PENDING" && expired ? "EXPIRED" : row.status

        return {
            id: row.id,
            email: row.email,
            role: row.role.name as "admin" | "member",
            status,
            expiresAt: row.expiresAt.toISOString(),
            createdAt: row.createdAt.toISOString(),
            invitedBy: this.serializeUser(row.invitedBy),
            ...(secrets
                ? { acceptUrl: secrets.acceptUrl, token: secrets.token }
                : {}),
        }
    }

    private inviteInclude = {
        role: true,
        invitedBy: {
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                profilePicture: true,
            },
        },
    } as const

    async listMembers(organizationId: string, _userId: string) {
        await this.assertNonPersonalOrg(organizationId)

        const rows = await prismaClient.organizationMember.findMany({
            where: { organizationId },
            include: {
                role: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        profilePicture: true,
                    },
                },
            },
            orderBy: { createdAt: "asc" },
        })

        return rows.map((row) => this.serializeMember(row))
    }

    async createInvite(
        organizationId: string,
        userId: string,
        roleName: string,
        input: z.infer<typeof createInviteSchema>,
    ) {
        await this.assertNonPersonalOrg(organizationId)
        this.requireManager(roleName)

        if (!INVITE_ROLES.has(input.role)) {
            throw new AppError(400, "VALIDATION_ERROR", "Invite role must be admin or member")
        }

        const email = input.email

        const existingMember = await prismaClient.organizationMember.findFirst({
            where: {
                organizationId,
                user: { email },
            },
        })
        if (existingMember) {
            throw new AppError(
                409,
                "CONFLICT",
                "A user with this email is already a member of this workspace",
            )
        }

        const pendingInvite = await prismaClient.organizationInvite.findFirst({
            where: {
                organizationId,
                email,
                status: "PENDING",
                expiresAt: { gt: new Date() },
            },
        })
        if (pendingInvite) {
            throw new AppError(
                409,
                "CONFLICT",
                "A pending invite already exists for this email",
            )
        }

        // Soft-expire any leftover PENDING rows past expiry so the partial unique index allows a new one
        await prismaClient.organizationInvite.updateMany({
            where: {
                organizationId,
                email,
                status: "PENDING",
                expiresAt: { lte: new Date() },
            },
            data: { status: "EXPIRED" },
        })

        const role = await this.getRoleByName(input.role)
        const { plaintext, tokenHash } = generateInviteToken()
        const expiresAt = new Date(Date.now() + INVITE_TTL_MS)

        try {
            const invite = await prismaClient.organizationInvite.create({
                data: {
                    organizationId,
                    email,
                    roleId: role.id,
                    tokenHash,
                    invitedByUserId: userId,
                    expiresAt,
                },
                include: this.inviteInclude,
            })

            return this.serializeInvite(invite, {
                token: plaintext,
                acceptUrl: this.buildAcceptUrl(plaintext),
            })
        } catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
                throw new AppError(
                    409,
                    "CONFLICT",
                    "A pending invite already exists for this email",
                )
            }
            throw err
        }
    }

    async listInvites(organizationId: string, roleName: string) {
        await this.assertNonPersonalOrg(organizationId)
        this.requireManager(roleName)

        const now = new Date()

        await prismaClient.organizationInvite.updateMany({
            where: {
                organizationId,
                status: "PENDING",
                expiresAt: { lte: now },
            },
            data: { status: "EXPIRED" },
        })

        const rows = await prismaClient.organizationInvite.findMany({
            where: {
                organizationId,
                status: "PENDING",
                expiresAt: { gt: now },
            },
            include: this.inviteInclude,
            orderBy: { createdAt: "desc" },
        })

        return rows.map((row) => this.serializeInvite(row))
    }

    async revokeInvite(
        organizationId: string,
        inviteId: string,
        roleName: string,
    ) {
        await this.assertNonPersonalOrg(organizationId)
        this.requireManager(roleName)

        const invite = await prismaClient.organizationInvite.findFirst({
            where: { id: inviteId, organizationId },
        })
        if (!invite) {
            throw new AppError(404, "NOT_FOUND", "Invite not found")
        }
        if (invite.status !== "PENDING") {
            throw new AppError(409, "CONFLICT", "Only pending invites can be revoked")
        }

        await prismaClient.organizationInvite.update({
            where: { id: inviteId },
            data: { status: "REVOKED" },
        })

        return { deleted: true as const }
    }

    async resendInvite(
        organizationId: string,
        inviteId: string,
        roleName: string,
    ) {
        await this.assertNonPersonalOrg(organizationId)
        this.requireManager(roleName)

        const invite = await prismaClient.organizationInvite.findFirst({
            where: { id: inviteId, organizationId },
            include: this.inviteInclude,
        })
        if (!invite) {
            throw new AppError(404, "NOT_FOUND", "Invite not found")
        }
        if (invite.status !== "PENDING" && invite.status !== "EXPIRED") {
            throw new AppError(409, "CONFLICT", "Only pending or expired invites can be resent")
        }

        const { plaintext, tokenHash } = generateInviteToken()
        const expiresAt = new Date(Date.now() + INVITE_TTL_MS)

        const updated = await prismaClient.organizationInvite.update({
            where: { id: inviteId },
            data: {
                tokenHash,
                expiresAt,
                status: "PENDING",
            },
            include: this.inviteInclude,
        })

        return this.serializeInvite(updated, {
            token: plaintext,
            acceptUrl: this.buildAcceptUrl(plaintext),
        })
    }

    async updateMemberRole(
        organizationId: string,
        memberId: string,
        actorUserId: string,
        actorRoleName: string,
        input: z.infer<typeof updateMemberRoleSchema>,
    ) {
        await this.assertNonPersonalOrg(organizationId)
        this.requireManager(actorRoleName)

        const target = await prismaClient.organizationMember.findFirst({
            where: { id: memberId, organizationId },
            include: { role: true },
        })
        if (!target) {
            throw new AppError(404, "NOT_FOUND", "Member not found")
        }

        if (target.userId === actorUserId) {
            throw new AppError(
                403,
                "FORBIDDEN",
                "You cannot change your own role; use transfer ownership or leave instead",
            )
        }

        if (input.role === "owner") {
            this.requireOwner(actorRoleName)
            return this.transferOwnership(organizationId, actorUserId, actorRoleName, {
                memberId,
            })
        }

        if (target.role.name === "owner") {
            throw new AppError(
                403,
                "FORBIDDEN",
                "Cannot change an owner's role; transfer ownership first",
            )
        }

        const newRole = await this.getRoleByName(input.role)
        const updated = await prismaClient.organizationMember.update({
            where: { id: memberId },
            data: { roleId: newRole.id },
            include: {
                role: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        profilePicture: true,
                    },
                },
            },
        })

        return this.serializeMember(updated)
    }

    async removeMember(
        organizationId: string,
        memberId: string,
        actorUserId: string,
        actorRoleName: string,
    ) {
        await this.assertNonPersonalOrg(organizationId)
        this.requireManager(actorRoleName)

        const target = await prismaClient.organizationMember.findFirst({
            where: { id: memberId, organizationId },
            include: { role: true },
        })
        if (!target) {
            throw new AppError(404, "NOT_FOUND", "Member not found")
        }

        if (target.userId === actorUserId) {
            throw new AppError(
                403,
                "FORBIDDEN",
                "You cannot remove yourself; use leave instead",
            )
        }

        if (target.role.name === "owner") {
            throw new AppError(
                403,
                "FORBIDDEN",
                "Cannot remove an owner; transfer ownership first",
            )
        }

        await prismaClient.organizationMember.delete({ where: { id: memberId } })
        return { deleted: true as const }
    }

    async transferOwnership(
        organizationId: string,
        actorUserId: string,
        actorRoleName: string,
        input: z.infer<typeof transferOwnershipSchema>,
    ) {
        await this.assertNonPersonalOrg(organizationId)
        this.requireOwner(actorRoleName)

        const actorMembership = await prismaClient.organizationMember.findUnique({
            where: {
                organizationId_userId: {
                    organizationId,
                    userId: actorUserId,
                },
            },
            include: { role: true },
        })
        if (!actorMembership || actorMembership.role.name !== "owner") {
            throw new AppError(403, "FORBIDDEN", "Only the workspace owner can transfer ownership")
        }

        if (actorMembership.id === input.memberId) {
            throw new AppError(400, "VALIDATION_ERROR", "Cannot transfer ownership to yourself")
        }

        const target = await prismaClient.organizationMember.findFirst({
            where: { id: input.memberId, organizationId },
            include: {
                role: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        profilePicture: true,
                    },
                },
            },
        })
        if (!target) {
            throw new AppError(404, "NOT_FOUND", "Member not found")
        }

        const ownerRole = await this.getRoleByName("owner")
        const adminRole = await this.getRoleByName("admin")

        const [updatedTarget] = await prismaClient.$transaction([
            prismaClient.organizationMember.update({
                where: { id: target.id },
                data: { roleId: ownerRole.id },
                include: {
                    role: true,
                    user: {
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                            profilePicture: true,
                        },
                    },
                },
            }),
            prismaClient.organizationMember.update({
                where: { id: actorMembership.id },
                data: { roleId: adminRole.id },
            }),
        ])

        return this.serializeMember(updatedTarget)
    }

    async leave(organizationId: string, userId: string) {
        await this.assertNonPersonalOrg(organizationId)

        const membership = await prismaClient.organizationMember.findUnique({
            where: {
                organizationId_userId: { organizationId, userId },
            },
            include: { role: true },
        })
        if (!membership) {
            throw new AppError(404, "NOT_FOUND", "You are not a member of this organization")
        }

        if (membership.role.name === "owner") {
            const ownerCount = await prismaClient.organizationMember.count({
                where: {
                    organizationId,
                    role: { name: "owner" },
                },
            })
            if (ownerCount <= 1) {
                throw new AppError(
                    403,
                    "FORBIDDEN",
                    "Transfer ownership before leaving; a workspace must have an owner",
                )
            }
        }

        await prismaClient.organizationMember.delete({ where: { id: membership.id } })
        return { deleted: true as const }
    }

    async previewInvite(token: string) {
        const tokenHash = hashInviteToken(token)
        const invite = await prismaClient.organizationInvite.findUnique({
            where: { tokenHash },
            include: {
                role: true,
                organization: { select: { name: true, slug: true, status: true } },
            },
        })

        if (!invite || invite.organization.status === "DELETED") {
            throw new AppError(404, "NOT_FOUND", "Invite not found")
        }

        const expired = invite.expiresAt.getTime() < Date.now()
        if (invite.status === "PENDING" && expired) {
            await prismaClient.organizationInvite.update({
                where: { id: invite.id },
                data: { status: "EXPIRED" },
            })
        }

        const status =
            invite.status === "PENDING" && expired ? "EXPIRED" : invite.status

        return {
            organizationName: invite.organization.name,
            role: invite.role.name as "admin" | "member",
            email: invite.email,
            expiresAt: invite.expiresAt.toISOString(),
            status,
        }
    }

    async acceptInvite(userId: string, token: string) {
        await organizationsService.ensureUserAndPersonalOrg(userId)

        const user = await prismaClient.user.findUnique({ where: { id: userId } })
        if (!user) {
            throw new AppError(404, "NOT_FOUND", "User not found")
        }
        if (!user.email) {
            throw new AppError(
                403,
                "FORBIDDEN",
                "Your account must have an email to accept an invite",
            )
        }

        const tokenHash = hashInviteToken(token)
        const invite = await prismaClient.organizationInvite.findUnique({
            where: { tokenHash },
            include: {
                role: true,
                organization: true,
            },
        })

        if (!invite || invite.organization.status === "DELETED") {
            throw new AppError(404, "NOT_FOUND", "Invite not found")
        }

        if (isPersonalOrganizationSlug(invite.organization.slug)) {
            throw new AppError(
                403,
                "FORBIDDEN",
                "Team management is not available on Personal workspaces",
            )
        }

        if (invite.status === "ACCEPTED") {
            throw new AppError(409, "CONFLICT", "This invite has already been accepted")
        }
        if (invite.status === "REVOKED") {
            throw new AppError(409, "CONFLICT", "This invite has been revoked")
        }

        if (invite.expiresAt.getTime() < Date.now() || invite.status === "EXPIRED") {
            if (invite.status === "PENDING") {
                await prismaClient.organizationInvite.update({
                    where: { id: invite.id },
                    data: { status: "EXPIRED" },
                })
            }
            throw new AppError(410, "INVITE_EXPIRED", "This invite has expired")
        }

        if (invite.status !== "PENDING") {
            throw new AppError(409, "CONFLICT", "This invite is no longer valid")
        }

        const userEmail = user.email.trim().toLowerCase()
        if (userEmail !== invite.email) {
            throw new AppError(
                403,
                "FORBIDDEN",
                "This invite was sent to a different email address",
            )
        }

        const existing = await prismaClient.organizationMember.findUnique({
            where: {
                organizationId_userId: {
                    organizationId: invite.organizationId,
                    userId,
                },
            },
        })
        if (existing) {
            throw new AppError(409, "CONFLICT", "You are already a member of this workspace")
        }

        try {
            const membership = await prismaClient.$transaction(async (tx) => {
                const created = await tx.organizationMember.create({
                    data: {
                        organizationId: invite.organizationId,
                        userId,
                        roleId: invite.roleId,
                    },
                    include: {
                        role: true,
                        user: {
                            select: {
                                id: true,
                                email: true,
                                firstName: true,
                                lastName: true,
                                profilePicture: true,
                            },
                        },
                    },
                })

                await tx.organizationInvite.update({
                    where: { id: invite.id },
                    data: {
                        status: "ACCEPTED",
                        acceptedAt: new Date(),
                        acceptedByUserId: userId,
                    },
                })

                return created
            })

            return {
                membership: this.serializeMember(membership),
                organization: {
                    id: invite.organization.id,
                    name: invite.organization.name,
                    slug: invite.organization.slug,
                },
            }
        } catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
                throw new AppError(409, "CONFLICT", "You are already a member of this workspace")
            }
            throw err
        }
    }
}

export default new MembersService()
