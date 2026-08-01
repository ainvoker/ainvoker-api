import { prisma } from "../../platform/prisma.js";
const ROLE_NAMES = ["owner", "admin", "member"];
export async function ensureRoles() {
    await Promise.all(ROLE_NAMES.map((name) => prisma.role.upsert({
        where: { name },
        create: { name },
        update: {},
    })));
}
export async function ensureUserAndPersonalOrg(userId) {
    await ensureRoles();
    const user = await prisma.user.upsert({
        where: { id: userId },
        create: { id: userId },
        update: {},
    });
    const membershipCount = await prisma.organizationMember.count({
        where: { userId },
    });
    if (membershipCount === 0) {
        const ownerRole = await prisma.role.findUniqueOrThrow({
            where: { name: "owner" },
        });
        const slug = `personal-${userId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24) || "user"}`;
        await prisma.$transaction(async (tx) => {
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
export async function listMyOrganizations(userId) {
    await ensureUserAndPersonalOrg(userId);
    const memberships = await prisma.organizationMember.findMany({
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
//# sourceMappingURL=service.js.map