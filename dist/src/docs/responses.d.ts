import { z } from "zod";
export declare const errorResponseSchema: z.ZodObject<{
    error: z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare function dataEnvelope<T extends z.ZodType>(schema: T): z.ZodObject<{
    data: T;
}, z.core.$strip>;
export declare const userSchema: z.ZodObject<{
    id: z.ZodString;
    firstName: z.ZodNullable<z.ZodString>;
    lastName: z.ZodNullable<z.ZodString>;
    profilePicture: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, z.core.$strip>;
export declare const organizationSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    slug: z.ZodString;
    status: z.ZodString;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, z.core.$strip>;
export declare const membershipSchema: z.ZodObject<{
    id: z.ZodString;
    role: z.ZodString;
    organization: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        slug: z.ZodString;
        status: z.ZodString;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
    }, z.core.$strip>;
    createdAt: z.ZodString;
}, z.core.$strip>;
export declare const meResponseSchema: z.ZodObject<{
    user: z.ZodObject<{
        id: z.ZodString;
        firstName: z.ZodNullable<z.ZodString>;
        lastName: z.ZodNullable<z.ZodString>;
        profilePicture: z.ZodNullable<z.ZodString>;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
    }, z.core.$strip>;
    memberships: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        role: z.ZodString;
        organization: z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            slug: z.ZodString;
            status: z.ZodString;
            createdAt: z.ZodString;
            updatedAt: z.ZodString;
        }, z.core.$strip>;
        createdAt: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const organizationListItemSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    slug: z.ZodString;
    status: z.ZodString;
    role: z.ZodString;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, z.core.$strip>;
export declare const projectSchema: z.ZodObject<{
    id: z.ZodString;
    organizationId: z.ZodString;
    name: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    environment: z.ZodString;
    status: z.ZodString;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, z.core.$strip>;
export declare const apiKeySchema: z.ZodObject<{
    id: z.ZodString;
    projectId: z.ZodString;
    keyName: z.ZodString;
    keyPrefix: z.ZodString;
    permissions: z.ZodNullable<z.ZodUnknown>;
    lastUsed: z.ZodNullable<z.ZodString>;
    expiresAt: z.ZodNullable<z.ZodString>;
    status: z.ZodString;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, z.core.$strip>;
export declare const createdApiKeySchema: z.ZodObject<{
    id: z.ZodString;
    projectId: z.ZodString;
    keyName: z.ZodString;
    keyPrefix: z.ZodString;
    permissions: z.ZodNullable<z.ZodUnknown>;
    lastUsed: z.ZodNullable<z.ZodString>;
    expiresAt: z.ZodNullable<z.ZodString>;
    status: z.ZodString;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    apiKey: z.ZodString;
}, z.core.$strip>;
export declare const deletedResponseSchema: z.ZodObject<{
    deleted: z.ZodLiteral<true>;
}, z.core.$strip>;
export declare const rootMessageSchema: z.ZodObject<{
    message: z.ZodString;
}, z.core.$strip>;
export declare const healthSchema: z.ZodObject<{
    status: z.ZodString;
}, z.core.$strip>;
//# sourceMappingURL=responses.d.ts.map