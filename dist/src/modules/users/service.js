import { prisma } from "../../platform/prisma.js";
import { ensureUserAndPersonalOrg } from "../organizations/service.js";
export async function getMe(userId) {
    const { user } = await ensureUserAndPersonalOrg(userId);
    const memberships = await prisma.organizationMember.findMany({
        where: { userId: user.id },
        include: {
            role: true,
            organization: true,
        },
        orderBy: { createdAt: "asc" },
    });
    return {
        user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            profilePicture: user.profilePicture,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        },
        memberships: memberships.map((m) => ({
            id: m.id,
            role: m.role.name,
            organization: {
                id: m.organization.id,
                name: m.organization.name,
                slug: m.organization.slug,
                status: m.organization.status,
                createdAt: m.organization.createdAt,
                updatedAt: m.organization.updatedAt,
            },
            createdAt: m.createdAt,
        })),
    };
}
//# sourceMappingURL=service.js.map