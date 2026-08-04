import { z } from "zod"

export const errorResponseSchema = z
    .object({
        error: z.object({
            code: z.string(),
            message: z.string(),
        }),
    })
    .meta({ id: "ErrorResponse" })

export function dataEnvelope<T extends z.ZodType>(schema: T) {
    return z.object({ data: schema })
}

export const userSchema = z
    .object({
        id: z.string(),
        email: z.string().nullable(),
        firstName: z.string().nullable(),
        lastName: z.string().nullable(),
        profilePicture: z.string().nullable(),
        themePreference: z.enum(["LIGHT", "DARK", "DEVICE"]),
        createdAt: z.string(),
        updatedAt: z.string(),
    })
    .meta({ id: "User" })

export const organizationSchema = z
    .object({
        id: z.string(),
        name: z.string(),
        slug: z.string(),
        status: z.string(),
        createdAt: z.string(),
        updatedAt: z.string(),
    })
    .meta({ id: "Organization" })

export const membershipSchema = z
    .object({
        id: z.string(),
        role: z.string(),
        organization: organizationSchema,
        createdAt: z.string(),
    })
    .meta({ id: "Membership" })

export const meResponseSchema = z
    .object({
        user: userSchema,
        memberships: z.array(membershipSchema),
    })
    .meta({ id: "MeResponse" })

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
    .meta({ id: "OrganizationListItem" })

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
    .meta({ id: "Project" })

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
    .meta({ id: "ApiKey" })

export const createdApiKeySchema = apiKeySchema
    .extend({
        apiKey: z.string(),
    })
    .meta({ id: "CreatedApiKey" })

export const deletedResponseSchema = z
    .object({
        deleted: z.literal(true),
    })
    .meta({ id: "DeletedResponse" })

export const rootMessageSchema = z
    .object({
        message: z.string(),
    })
    .meta({ id: "RootMessage" })

export const healthSchema = z
    .object({
        status: z.string(),
    })
    .meta({ id: "Health" })

export const aiRequestSummarySchema = z
    .object({
        id: z.string(),
        projectId: z.string(),
        apiKeyId: z.string(),
        apiKeyName: z.string(),
        apiKeyPrefix: z.string(),
        model: z.string(),
        serviceType: z.string(),
        requestStatus: z.string(),
        inputTokens: z.number().int().nullable(),
        outputTokens: z.number().int().nullable(),
        totalTokens: z.number().int().nullable(),
        latency: z.number().int().nullable(),
        requestCost: z.string().nullable(),
        createdAt: z.string(),
    })
    .meta({ id: "AiRequestSummary" })

export const aiRequestListSchema = z
    .object({
        items: z.array(aiRequestSummarySchema),
        total: z.number().int(),
        limit: z.number().int(),
        offset: z.number().int(),
    })
    .meta({ id: "AiRequestList" })

export const aiRequestDetailSchema = aiRequestSummarySchema
    .extend({
        requestPayload: z.unknown(),
        responsePayload: z.unknown().nullable(),
    })
    .meta({ id: "AiRequestDetail" })

export const chatMessageSchema = z
    .object({
        role: z.enum(["system", "user", "assistant"]),
        content: z.string(),
    })
    .meta({ id: "ChatMessage" })

export const chatUsageSchema = z
    .object({
        inputTokens: z.number().int(),
        outputTokens: z.number().int(),
        totalTokens: z.number().int(),
    })
    .meta({ id: "ChatUsage" })

export const textChatResponseSchema = z
    .object({
        id: z.string(),
        model: z.string(),
        message: chatMessageSchema,
        usage: chatUsageSchema.nullable(),
    })
    .meta({ id: "TextChatResponse" })
