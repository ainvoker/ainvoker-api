import { Prisma } from "../../generated/prisma/client.js"
import { AppError } from "../../platform/errors.js"
import prismaClient from "../../platform/prisma.js"
import { AUDIT_ACTIONS } from "../audit/actions.js"
import { recordAuditEvent } from "../audit/record.js"
import {
    ensureBillingCatalog,
    getPlanByName,
    PLAN_NAMES,
} from "../billing/catalog.js"
import type { ProfileFields } from "../users/schemas.js"
import type { createOrganizationSchema, updateOrganizationSchema } from "./schemas.js"
import type { z } from "zod"

const ROLE_NAMES = ["owner", "admin", "member"] as const
const WORKSPACE_EDITOR_ROLES = new Set(["owner", "admin"])

type OrganizationRow = {
    id: string
    name: string
    slug: string
    status: string
    createdAt: Date
    updatedAt: Date
}

function personalOrgSlug(userId: string) {
    const sanitized = userId.replace(/[^a-zA-Z0-9_-]/g, "")
    return `personal-${sanitized || "user"}`
}

export function isPersonalOrganizationSlug(slug: string) {
    return slug.startsWith("personal-")
}

/** Lowercase slug from a display name; falls back to "workspace". */
export function slugifyOrganizationName(name: string) {
    const slug = name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 64)

    return slug || "workspace"
}

class OrganizationService {
    async ensureRoles() {
        await Promise.all(
            ROLE_NAMES.map((name) =>
                prismaClient.role.upsert({
                    where: { name },
                    create: { name },
                    update: {},
                }),
            ),
        )
    }

    async ensureUserAndPersonalOrg(userId: string, profile?: ProfileFields) {
        await this.ensureRoles()
        await ensureBillingCatalog()

        const preexisting = await prismaClient.user.findUnique({
            where: { id: userId },
            select: { id: true },
        })
        const isNewUser = !preexisting

        let user = await prismaClient.user.upsert({
            where: { id: userId },
            create: {
                id: userId,
                email: profile?.email ?? null,
                firstName: profile?.firstName ?? null,
                lastName: profile?.lastName ?? null,
                profilePicture: profile?.profilePicture ?? null,
            },
            update: {},
        })

        if (isNewUser) {
            await recordAuditEvent({
                actorUserId: userId,
                actorType: "USER",
                action: AUDIT_ACTIONS.userCreated,
                targetType: "user",
                targetId: userId,
                summary: `Account created${user.email ? ` (${user.email})` : ""}`,
                metadata: { email: user.email },
            })
        }

        // Fill empty profile fields once (e.g. if GET /me created the row before bootstrap).
        if (profile) {
            const data = {
                ...(user.email == null && profile.email !== undefined
                    ? { email: profile.email }
                    : {}),
                ...(user.firstName == null && profile.firstName !== undefined
                    ? { firstName: profile.firstName }
                    : {}),
                ...(user.lastName == null && profile.lastName !== undefined
                    ? { lastName: profile.lastName }
                    : {}),
                ...(user.profilePicture == null && profile.profilePicture !== undefined
                    ? { profilePicture: profile.profilePicture }
                    : {}),
            }

            if (Object.keys(data).length > 0) {
                user = await prismaClient.user.update({
                    where: { id: userId },
                    data,
                })
            }
        }

        const alreadyMember = await prismaClient.organizationMember.findFirst({
            where: { userId },
            select: { id: true },
        })

        if (!alreadyMember) {
            const createdOrgId = await this.createPersonalOrgIfNeeded(userId)
            if (createdOrgId) {
                await recordAuditEvent({
                    actorUserId: userId,
                    actorType: "USER",
                    action: AUDIT_ACTIONS.organizationCreated,
                    targetType: "organization",
                    targetId: createdOrgId,
                    organizationId: createdOrgId,
                    summary: 'Personal workspace created',
                    metadata: { isPersonal: true },
                })
            }
        }

        await this.ensureFreeSubscriptionOnPersonalOrg(userId)

        return { user }
    }

    /**
     * Attach Free only when the Personal org has no ACTIVE subscription.
     * Never downgrades Pro/Scale.
     */
    private async ensureFreeSubscriptionOnPersonalOrg(userId: string) {
        const slug = personalOrgSlug(userId)
        const org = await prismaClient.organization.findUnique({ where: { slug } })
        if (!org) return

        const active = await prismaClient.subscription.findFirst({
            where: { organizationId: org.id, status: "ACTIVE" },
            select: { id: true },
        })
        if (active) return

        const freePlan = await getPlanByName(PLAN_NAMES.free)
        await prismaClient.subscription.create({
            data: {
                organizationId: org.id,
                planId: freePlan.id,
                status: "ACTIVE",
                startedAt: new Date(),
            },
        })
    }

    /**
     * Idempotent under concurrent bootstrap (React Strict Mode, double refresh, etc.).
     * @returns organization id when this call created the Personal org; otherwise null.
     */
    private async createPersonalOrgIfNeeded(userId: string): Promise<string | null> {
        const ownerRole = await prismaClient.role.findUniqueOrThrow({
            where: { name: "owner" },
        })
        const slug = personalOrgSlug(userId)
        const freePlan = await getPlanByName(PLAN_NAMES.free)

        try {
            return await prismaClient.$transaction(async (tx) => {
                const existingMembership = await tx.organizationMember.findFirst({
                    where: { userId },
                    select: { id: true },
                })
                if (existingMembership) {
                    return null
                }

                const existingOrg = await tx.organization.findUnique({
                    where: { slug },
                })

                if (existingOrg) {
                    await tx.organizationMember.upsert({
                        where: {
                            organizationId_userId: {
                                organizationId: existingOrg.id,
                                userId,
                            },
                        },
                        create: {
                            organizationId: existingOrg.id,
                            userId,
                            roleId: ownerRole.id,
                        },
                        update: {},
                    })
                    return null
                }

                const organization = await tx.organization.create({
                    data: {
                        name: "Personal",
                        slug,
                        createdByUserId: userId,
                    },
                })

                await tx.organizationMember.create({
                    data: {
                        organizationId: organization.id,
                        userId,
                        roleId: ownerRole.id,
                    },
                })

                await tx.subscription.create({
                    data: {
                        organizationId: organization.id,
                        planId: freePlan.id,
                        status: "ACTIVE",
                        startedAt: new Date(),
                    },
                })

                return organization.id
            })
        } catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
                // Concurrent request created the org/membership first — treat as success.
                const membership = await prismaClient.organizationMember.findFirst({
                    where: { userId },
                    select: { id: true },
                })
                if (membership) {
                    return null
                }

                const org = await prismaClient.organization.findUnique({ where: { slug } })
                if (org) {
                    await prismaClient.organizationMember.upsert({
                        where: {
                            organizationId_userId: {
                                organizationId: org.id,
                                userId,
                            },
                        },
                        create: {
                            organizationId: org.id,
                            userId,
                            roleId: ownerRole.id,
                        },
                        update: {},
                    })
                    return null
                }
            }
            throw err
        }
    }

    private serializeListItem(organization: OrganizationRow, role: string) {
        const isPersonal = isPersonalOrganizationSlug(organization.slug)
        return {
            id: organization.id,
            name: organization.name,
            slug: organization.slug,
            status: organization.status,
            role,
            isPersonal,
            permissions: {
                canEdit: WORKSPACE_EDITOR_ROLES.has(role) && !isPersonal,
                canDelete: role === "owner" && !isPersonal,
            },
            createdAt: organization.createdAt,
            updatedAt: organization.updatedAt,
        }
    }

    async getOrganization(organizationId: string, userId: string) {
        await this.ensureUserAndPersonalOrg(userId)

        const membership = await prismaClient.organizationMember.findUnique({
            where: {
                organizationId_userId: { organizationId, userId },
            },
            include: {
                role: true,
                organization: true,
            },
        })

        if (!membership || membership.organization.status === "DELETED") {
            throw new AppError(404, "NOT_FOUND", "Organization not found")
        }

        return this.serializeListItem(membership.organization, membership.role.name)
    }

    private async allocateUniqueSlug(baseSlug: string) {
        const existing = await prismaClient.organization.findUnique({
            where: { slug: baseSlug },
            select: { id: true },
        })
        if (!existing) return baseSlug

        for (let attempt = 0; attempt < 8; attempt++) {
            const suffix = Math.random().toString(36).slice(2, 6)
            const candidate = `${baseSlug.slice(0, 59)}-${suffix}`
            const taken = await prismaClient.organization.findUnique({
                where: { slug: candidate },
                select: { id: true },
            })
            if (!taken) return candidate
        }

        throw new AppError(409, "CONFLICT", "Could not allocate a unique workspace slug")
    }

    async createOrganization(
        userId: string,
        input: z.infer<typeof createOrganizationSchema>,
    ) {
        await this.ensureUserAndPersonalOrg(userId)

        const paidPlan = await getPlanByName(input.plan)

        const ownerRole = await prismaClient.role.findUniqueOrThrow({
            where: { name: "owner" },
        })

        const baseSlug = input.slug ?? slugifyOrganizationName(input.name)
        const slug = input.slug
            ? baseSlug
            : await this.allocateUniqueSlug(baseSlug)

        const subscriptionStatus =
            input.plan === PLAN_NAMES.pro || input.plan === PLAN_NAMES.scale ? "PENDING" : "ACTIVE"

        try {
            const organization = await prismaClient.$transaction(async (tx) => {
                const org = await tx.organization.create({
                    data: {
                        name: input.name,
                        slug,
                        createdByUserId: userId,
                    },
                })

                await tx.organizationMember.create({
                    data: {
                        organizationId: org.id,
                        userId,
                        roleId: ownerRole.id,
                    },
                })

                await tx.subscription.create({
                    data: {
                        organizationId: org.id,
                        planId: paidPlan.id,
                        status: subscriptionStatus,
                        startedAt: new Date(),
                    },
                })

                return org
            })

            await recordAuditEvent({
                actorUserId: userId,
                actorType: "USER",
                action: AUDIT_ACTIONS.organizationCreated,
                targetType: "organization",
                targetId: organization.id,
                organizationId: organization.id,
                summary: `Workspace "${organization.name}" created`,
                metadata: { name: organization.name, slug: organization.slug, plan: input.plan },
            })

            return this.serializeListItem(organization, "owner")
        } catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
                throw new AppError(409, "CONFLICT", "An organization with this slug already exists")
            }
            throw err
        }
    }

    async listMyOrganizations(userId: string) {
        await this.ensureUserAndPersonalOrg(userId)

        const memberships = await prismaClient.organizationMember.findMany({
            where: {
                userId,
                organization: { status: { not: "DELETED" } },
            },
            include: {
                role: true,
                organization: true,
            },
            orderBy: { createdAt: "asc" },
        })

        return memberships.map((m) => this.serializeListItem(m.organization, m.role.name))
    }

    async updateOrganization(
        organizationId: string,
        userId: string,
        input: z.infer<typeof updateOrganizationSchema>,
    ) {
        await this.ensureUserAndPersonalOrg(userId)

        const membership = await prismaClient.organizationMember.findUnique({
            where: {
                organizationId_userId: { organizationId, userId },
            },
            include: {
                role: true,
                organization: true,
            },
        })

        if (!membership || membership.organization.status === "DELETED") {
            throw new AppError(404, "NOT_FOUND", "Organization not found")
        }

        if (!WORKSPACE_EDITOR_ROLES.has(membership.role.name)) {
            throw new AppError(
                403,
                "FORBIDDEN",
                "Only workspace owners and admins can edit this workspace",
            )
        }

        if (isPersonalOrganizationSlug(membership.organization.slug)) {
            throw new AppError(
                403,
                "FORBIDDEN",
                "Your Personal workspace cannot be renamed",
            )
        }

        if (input.slug !== undefined && isPersonalOrganizationSlug(input.slug)) {
            throw new AppError(
                400,
                "VALIDATION_ERROR",
                "Slug cannot use the Personal workspace prefix",
            )
        }

        try {
            const organization = await prismaClient.organization.update({
                where: { id: organizationId },
                data: {
                    ...(input.name !== undefined ? { name: input.name } : {}),
                    ...(input.slug !== undefined ? { slug: input.slug } : {}),
                },
            })

            await recordAuditEvent({
                actorUserId: userId,
                actorType: "USER",
                action: AUDIT_ACTIONS.organizationUpdated,
                targetType: "organization",
                targetId: organizationId,
                organizationId,
                summary: `Workspace "${organization.name}" updated`,
                metadata: {
                    before: {
                        name: membership.organization.name,
                        slug: membership.organization.slug,
                    },
                    after: {
                        name: organization.name,
                        slug: organization.slug,
                    },
                },
            })

            return this.serializeListItem(organization, membership.role.name)
        } catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
                throw new AppError(409, "CONFLICT", "An organization with this slug already exists")
            }
            throw err
        }
    }

    async deleteOrganization(organizationId: string, userId: string) {
        await this.ensureUserAndPersonalOrg(userId)

        const membership = await prismaClient.organizationMember.findUnique({
            where: {
                organizationId_userId: { organizationId, userId },
            },
            include: {
                role: true,
                organization: true,
            },
        })

        if (!membership || membership.organization.status === "DELETED") {
            throw new AppError(404, "NOT_FOUND", "Organization not found")
        }

        if (membership.role.name !== "owner") {
            throw new AppError(
                403,
                "FORBIDDEN",
                "Only organization owners can delete a workspace",
            )
        }

        if (isPersonalOrganizationSlug(membership.organization.slug)) {
            throw new AppError(
                403,
                "FORBIDDEN",
                "Your Personal workspace cannot be deleted",
            )
        }

        const orgName = membership.organization.name

        await prismaClient.$transaction(async (tx) => {
            await tx.subscription.updateMany({
                where: {
                    organizationId,
                    status: { not: "CANCELED" },
                },
                data: { status: "CANCELED" },
            })

            await tx.organization.update({
                where: { id: organizationId },
                data: { status: "DELETED" },
            })
        })

        await recordAuditEvent({
            actorUserId: userId,
            actorType: "USER",
            action: AUDIT_ACTIONS.organizationDeleted,
            targetType: "organization",
            targetId: organizationId,
            organizationId,
            summary: `Workspace "${orgName}" deleted`,
            metadata: { name: orgName, slug: membership.organization.slug },
        })

        return { deleted: true as const }
    }
}

export default new OrganizationService()
