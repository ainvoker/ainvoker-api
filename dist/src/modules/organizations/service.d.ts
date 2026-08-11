import type { ProfileFields } from "../users/schemas.js";
import type { createOrganizationSchema } from "./schemas.js";
import type { z } from "zod";
/** Lowercase slug from a display name; falls back to "workspace". */
export declare function slugifyOrganizationName(name: string): string;
declare class OrganizationService {
    ensureRoles(): Promise<void>;
    ensureUserAndPersonalOrg(userId: string, profile?: ProfileFields): Promise<{
        user: {
            email: string | null;
            firstName: string | null;
            lastName: string | null;
            profilePicture: string | null;
            themePreference: import("../../generated/prisma/enums.js").ThemePreference;
            id: string;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    /**
     * Attach Free only when the Personal org has no ACTIVE subscription.
     * Never downgrades Pro/Scale.
     */
    private ensureFreeSubscriptionOnPersonalOrg;
    /** Idempotent under concurrent bootstrap (React Strict Mode, double refresh, etc.). */
    private createPersonalOrgIfNeeded;
    private allocateUniqueSlug;
    createOrganization(userId: string, input: z.infer<typeof createOrganizationSchema>): Promise<{
        id: string;
        name: string;
        slug: string;
        status: import("../../generated/prisma/enums.js").OrganizationStatus;
        role: "owner";
        createdAt: Date;
        updatedAt: Date;
    }>;
    listMyOrganizations(userId: string): Promise<{
        id: string;
        name: string;
        slug: string;
        status: import("../../generated/prisma/enums.js").OrganizationStatus;
        role: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
}
declare const _default: OrganizationService;
export default _default;
//# sourceMappingURL=service.d.ts.map