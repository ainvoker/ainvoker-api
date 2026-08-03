import { Prisma } from "../../../generated/prisma/client.js";
import prismaClient from "../../platform/prisma.js";
import type { ProfileFields } from "../users/schemas.js";

const ROLE_NAMES = ["owner", "admin", "member"] as const;

function personalOrgSlug(userId: string) {
    const sanitized = userId.replace(/[^a-zA-Z0-9_-]/g, "");
    return `personal-${sanitized || "user"}`;
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
        );
    }

    async ensureUserAndPersonalOrg(userId: string, profile?: ProfileFields) {
        await this.ensureRoles();

        let user = await prismaClient.user.upsert({
            where: { id: userId },
            create: {
                id: userId,
                firstName: profile?.firstName ?? null,
                lastName: profile?.lastName ?? null,
                profilePicture: profile?.profilePicture ?? null,
            },
            update: {},
        });

        // Fill empty profile fields once (e.g. if GET /me created the row before bootstrap).
        if (profile) {
            const data = {
                ...(user.firstName == null && profile.firstName !== undefined
                    ? { firstName: profile.firstName }
                    : {}),
                ...(user.lastName == null && profile.lastName !== undefined
                    ? { lastName: profile.lastName }
                    : {}),
                ...(user.profilePicture == null && profile.profilePicture !== undefined
                    ? { profilePicture: profile.profilePicture }
                    : {}),
            };

            if (Object.keys(data).length > 0) {
                user = await prismaClient.user.update({
                    where: { id: userId },
                    data,
                });
            }
        }

        const alreadyMember = await prismaClient.organizationMember.findFirst({
            where: { userId },
            select: { id: true },
        });

        if (!alreadyMember) {
            await this.createPersonalOrgIfNeeded(userId);
        }

        return { user };
    }

    /** Idempotent under concurrent bootstrap (React Strict Mode, double refresh, etc.). */
    private async createPersonalOrgIfNeeded(userId: string) {
        const ownerRole = await prismaClient.role.findUniqueOrThrow({
            where: { name: "owner" },
        });
        const slug = personalOrgSlug(userId);

        try {
            await prismaClient.$transaction(async (tx) => {
                const existingMembership = await tx.organizationMember.findFirst({
                    where: { userId },
                    select: { id: true },
                });
                if (existingMembership) {
                    return;
                }

                const existingOrg = await tx.organization.findUnique({
                    where: { slug },
                });

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
                    });
                    return;
                }

                const organization = await tx.organization.create({
                    data: {
                        name: "Personal",
                        slug,
                        createdByUserId: userId,
                    },
                });

                await tx.organizationMember.create({
                    data: {
                        organizationId: organization.id,
                        userId,
                        roleId: ownerRole.id,
                    },
                });
            });
        } catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
                // Concurrent request created the org/membership first — treat as success.
                const membership = await prismaClient.organizationMember.findFirst({
                    where: { userId },
                    select: { id: true },
                });
                if (membership) {
                    return;
                }

                const org = await prismaClient.organization.findUnique({ where: { slug } });
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
                    });
                    return;
                }
            }
            throw err;
        }
    }

    async listMyOrganizations(userId: string) {
        await this.ensureUserAndPersonalOrg(userId);

        const memberships = await prismaClient.organizationMember.findMany({
            where: { userId },
            include: {
                role: true,
                organization: true,
            },
            orderBy: { createdAt: "asc" },
        });

        return memberships.map((m) => ({
            id: m.organization.id,
            name: m.organization.name,
            slug: m.organization.slug,
            status: m.organization.status,
            role: m.role.name,
            createdAt: m.organization.createdAt,
            updatedAt: m.organization.updatedAt,
        }));
    }
}

export default new OrganizationService();
