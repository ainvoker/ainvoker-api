import { Prisma } from "../../../generated/prisma/client.js"
import { AppError } from "../../platform/errors.js"
import prismaClient from "../../platform/prisma.js"
import type { ProfileFields } from "../users/schemas.js"
import type { createOrganizationSchema } from "./schemas.js"
import type { z } from "zod"

const ROLE_NAMES = ["owner", "admin", "member"] as const

function personalOrgSlug(userId: string) {
    const sanitized = userId.replace(/[^a-zA-Z0-9_-]/g, "")
    return `personal-${sanitized || "user"}`
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
            await this.createPersonalOrgIfNeeded(userId)
        }

        return { user }
    }

    /** Idempotent under concurrent bootstrap (React Strict Mode, double refresh, etc.). */
    private async createPersonalOrgIfNeeded(userId: string) {
        const ownerRole = await prismaClient.role.findUniqueOrThrow({
            where: { name: "owner" },
        })
        const slug = personalOrgSlug(userId)

        try {
            await prismaClient.$transaction(async (tx) => {
                const existingMembership = await tx.organizationMember.findFirst({
                    where: { userId },
                    select: { id: true },
                })
                if (existingMembership) {
                    return
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
                    return
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
            })
        } catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
                // Concurrent request created the org/membership first — treat as success.
                const membership = await prismaClient.organizationMember.findFirst({
                    where: { userId },
                    select: { id: true },
                })
                if (membership) {
                    return
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
                    return
                }
            }
            throw err
        }
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

        const ownerRole = await prismaClient.role.findUniqueOrThrow({
            where: { name: "owner" },
        })

        const baseSlug = input.slug ?? slugifyOrganizationName(input.name)
        // Explicit slug must be free; auto-generated slugs get a suffix if taken.
        const slug = input.slug
            ? baseSlug
            : await this.allocateUniqueSlug(baseSlug)

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

                return org
            })

            return {
                id: organization.id,
                name: organization.name,
                slug: organization.slug,
                status: organization.status,
                role: "owner" as const,
                createdAt: organization.createdAt,
                updatedAt: organization.updatedAt,
            }
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
            where: { userId },
            include: {
                role: true,
                organization: true,
            },
            orderBy: { createdAt: "asc" },
        })

        return memberships.map((m) => ({
            id: m.organization.id,
            name: m.organization.name,
            slug: m.organization.slug,
            status: m.organization.status,
            role: m.role.name,
            createdAt: m.organization.createdAt,
            updatedAt: m.organization.updatedAt,
        }))
    }
}

export default new OrganizationService()
