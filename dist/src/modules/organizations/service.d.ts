export declare function ensureRoles(): Promise<void>;
export declare function ensureUserAndPersonalOrg(userId: string): Promise<{
    user: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        firstName: string | null;
        lastName: string | null;
        profilePicture: string | null;
    };
}>;
export declare function listMyOrganizations(userId: string): Promise<{
    id: string;
    name: string;
    slug: string;
    status: import("../../../generated/prisma/enums.js").OrganizationStatus;
    role: string;
    createdAt: Date;
    updatedAt: Date;
}[]>;
//# sourceMappingURL=service.d.ts.map