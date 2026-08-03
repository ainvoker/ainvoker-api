import type { ProfileFields } from "../users/schemas.js";
declare class OrganizationService {
    ensureRoles(): Promise<void>;
    ensureUserAndPersonalOrg(userId: string, profile?: ProfileFields): Promise<{
        user: {
            firstName: string | null;
            lastName: string | null;
            profilePicture: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    /** Idempotent under concurrent bootstrap (React Strict Mode, double refresh, etc.). */
    private createPersonalOrgIfNeeded;
    listMyOrganizations(userId: string): Promise<{
        id: string;
        name: string;
        slug: string;
        status: import("../../../generated/prisma/enums.js").OrganizationStatus;
        role: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
}
declare const _default: OrganizationService;
export default _default;
//# sourceMappingURL=service.d.ts.map