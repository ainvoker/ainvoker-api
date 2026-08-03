import { z } from "zod";

export const errorResponseSchema = z
    .object({
        error: z.object({
            code: z.string(),
            message: z.string(),
        }),
    })
    .meta({ id: "ErrorResponse" });

export function dataEnvelope<T extends z.ZodType>(schema: T) {
    return z.object({ data: schema });
}

export const userSchema = z
    .object({
        id: z.string(),
        firstName: z.string().nullable(),
        lastName: z.string().nullable(),
        profilePicture: z.string().nullable(),
        createdAt: z.string(),
        updatedAt: z.string(),
    })
    .meta({ id: "User" });

export const organizationSchema = z
    .object({
        id: z.string(),
        name: z.string(),
        slug: z.string(),
        status: z.string(),
        createdAt: z.string(),
        updatedAt: z.string(),
    })
    .meta({ id: "Organization" });

export const membershipSchema = z
    .object({
        id: z.string(),
        role: z.string(),
        organization: organizationSchema,
        createdAt: z.string(),
    })
    .meta({ id: "Membership" });

export const meResponseSchema = z
    .object({
        user: userSchema,
        memberships: z.array(membershipSchema),
    })
    .meta({ id: "MeResponse" });

export const organizationListItemSchema = z
    .object({
        id: z.string(),
        name: z.string(),
        slug: z.string(),
        status: z.string(),
        role: z.string(),
        createdAt: z.string(),
        updatedAt: z.string(),
    })
    .meta({ id: "OrganizationListItem" });

export const projectSchema = z
    .object({
        id: z.string(),
        organizationId: z.string(),
        name: z.string(),
        description: z.string().nullable(),
        environment: z.string(),
        status: z.string(),
        createdAt: z.string(),
        updatedAt: z.string(),
    })
    .meta({ id: "Project" });

export const apiKeySchema = z
    .object({
        id: z.string(),
        projectId: z.string(),
        keyName: z.string(),
        keyPrefix: z.string(),
        permissions: z.unknown().nullable(),
        lastUsed: z.string().nullable(),
        expiresAt: z.string().nullable(),
        status: z.string(),
        createdAt: z.string(),
        updatedAt: z.string(),
    })
    .meta({ id: "ApiKey" });

export const createdApiKeySchema = apiKeySchema
    .extend({
        apiKey: z.string(),
    })
    .meta({ id: "CreatedApiKey" });

export const deletedResponseSchema = z
    .object({
        deleted: z.literal(true),
    })
    .meta({ id: "DeletedResponse" });

export const rootMessageSchema = z
    .object({
        message: z.string(),
    })
    .meta({ id: "RootMessage" });

export const healthSchema = z
    .object({
        status: z.string(),
    })
    .meta({ id: "Health" });
