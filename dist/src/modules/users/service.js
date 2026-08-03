import prismaClient from "../../platform/prisma.js";
import organizationsService from "../organizations/service.js";
class UserService {
    serializeUser(user) {
        return {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            profilePicture: user.profilePicture,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
    async getMe(userId, profile) {
        const { user } = await organizationsService.ensureUserAndPersonalOrg(userId, profile);
        const memberships = await prismaClient.organizationMember.findMany({
            where: { userId: user.id },
            include: {
                role: true,
                organization: true,
            },
            orderBy: { createdAt: "asc" },
        });
        return {
            user: this.serializeUser(user),
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
    async updateProfile(userId, input) {
        await organizationsService.ensureUserAndPersonalOrg(userId);
        const user = await prismaClient.user.update({
            where: { id: userId },
            data: {
                ...(input.firstName !== undefined ? { firstName: input.firstName } : {}),
                ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
                ...(input.profilePicture !== undefined
                    ? { profilePicture: input.profilePicture }
                    : {}),
            },
        });
        return this.serializeUser(user);
    }
}
export default new UserService();
//# sourceMappingURL=service.js.map