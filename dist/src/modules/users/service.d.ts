export declare function getMe(userId: string): Promise<{
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
//# sourceMappingURL=service.d.ts.map