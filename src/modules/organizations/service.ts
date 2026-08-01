import prismaClient from "../../platform/prisma.js";

const ROLE_NAMES = ["owner", "admin", "member"] as const;

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

    async ensureUserAndPersonalOrg(userId: string) {
        await this.ensureRoles();

        const user = await prismaClient.user.upsert({
            where: { id: userId },
            create: { id: userId },
            update: {},
        });

        const membershipCount = await prismaClient.organizationMember.count({
            where: { userId },
        });

        if (membershipCount === 0) {
            const ownerRole = await prismaClient.role.findUniqueOrThrow({
                where: { name: "owner" },
            });

            const slug = `personal-${userId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24) || "user"}`;

            await prismaClient.$transaction(async (tx) => {
                const existing = await tx.organizationMember.count({ where: { userId } });
                if (existing > 0) {
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
        }

        return { user };
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
