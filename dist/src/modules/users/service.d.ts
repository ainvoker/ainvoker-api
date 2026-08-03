import type { z } from "zod";
import type { ProfileFields, updateProfileSchema } from "./schemas.js";
declare class UserService {
    private serializeUser;
    getMe(userId: string, profile?: ProfileFields): Promise<{
        user: {
            id: string;
            firstName: string | null;
            lastName: string | null;
            profilePicture: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
        memberships: {
            id: string;
            role: string;
            organization: {
                id: string;
                name: string;
                slug: string;
                status: import("../../../generated/prisma/enums.js").OrganizationStatus;
                createdAt: Date;
                updatedAt: Date;
            };
            createdAt: Date;
        }[];
    }>;
    updateProfile(userId: string, input: z.infer<typeof updateProfileSchema>): Promise<{
        id: string;
        firstName: string | null;
        lastName: string | null;
        profilePicture: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
declare const _default: UserService;
export default _default;
//# sourceMappingURL=service.d.ts.map