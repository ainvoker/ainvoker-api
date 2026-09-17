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
        isPersonal: z.boolean(),
        permissions: z.object({
            canEdit: z.boolean(),
            canDelete: z.boolean(),
        }),
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

export const allowedOriginSchema = z
    .object({
        id: z.string(),
        projectId: z.string(),
        origin: z.string(),
        createdAt: z.string(),
        updatedAt: z.string(),
    })
    .meta({ id: "AllowedOrigin" })

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

export const usagePlanSnapshotSchema = z
    .object({
        planName: z.string(),
        status: z.string(),
        billingMode: z.string(),
        requestLimit: z.number().int(),
        tokenLimit: z.number().int(),
        expiresAt: z.string().nullable(),
    })
    .meta({ id: "UsagePlanSnapshot" })

export const usagePeriodSchema = z
    .object({
        requestsUsed: z.number().int(),
        tokensUsed: z.number().int(),
        successfulRequests: z.number().int(),
        failedRequests: z.number().int(),
        periodStart: z.string(),
    })
    .meta({ id: "UsagePeriod" })

export const orgUsageProjectSchema = z
    .object({
        id: z.string(),
        name: z.string(),
        environment: z.string(),
        status: z.string(),
        requestsUsed: z.number().int(),
        tokensUsed: z.number().int(),
    })
    .meta({ id: "OrgUsageProject" })

export const orgRecentRequestSchema = aiRequestSummarySchema
    .extend({
        projectName: z.string().nullable(),
    })
    .meta({ id: "OrgRecentRequest" })

export const orgUsageByModelSchema = z
    .object({
        modelId: z.number().int(),
        model: z.string(),
        requestsUsed: z.number().int(),
        tokensUsed: z.number().int(),
        percentOfTokenQuota: z.number().nullable(),
    })
    .meta({ id: "OrgUsageByModel" })

export const usageDailyPointSchema = z
    .object({
        date: z.string(),
        requestsUsed: z.number().int(),
        tokensUsed: z.number().int(),
        successfulRequests: z.number().int(),
        failedRequests: z.number().int(),
    })
    .meta({ id: "UsageDailyPoint" })

export const usageDailySegmentPointSchema = z
    .object({
        date: z.string(),
        id: z.string(),
        name: z.string(),
        requestsUsed: z.number().int(),
        tokensUsed: z.number().int(),
    })
    .meta({ id: "UsageDailySegmentPoint" })

export const organizationUsageSchema = z
    .object({
        plan: usagePlanSnapshotSchema.nullable(),
        period: usagePeriodSchema,
        projects: z.array(orgUsageProjectSchema),
        byModel: z.array(orgUsageByModelSchema),
        daily: z.array(usageDailyPointSchema),
        dailyByProject: z.array(usageDailySegmentPointSchema),
        dailyByModel: z.array(usageDailySegmentPointSchema),
        recentRequests: z.array(orgRecentRequestSchema),
    })
    .meta({ id: "OrganizationUsage" })

export const projectUsagePeriodSchema = usagePeriodSchema
    .extend({
        avgLatency: z.number().int().nullable(),
    })
    .meta({ id: "ProjectUsagePeriod" })

export const projectUsageKeysSchema = z
    .object({
        total: z.number().int(),
        active: z.number().int(),
    })
    .meta({ id: "ProjectUsageKeys" })

export const projectUsageSchema = z
    .object({
        project: projectSchema,
        plan: usagePlanSnapshotSchema.nullable(),
        period: projectUsagePeriodSchema,
        organizationPeriod: usagePeriodSchema,
        keys: projectUsageKeysSchema,
        byModel: z.array(orgUsageByModelSchema),
        daily: z.array(usageDailyPointSchema),
        organizationDaily: z.array(usageDailyPointSchema),
        recentRequests: z.array(aiRequestSummarySchema),
    })
    .meta({ id: "ProjectUsage" })

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

export const memberUserSchema = z
    .object({
        id: z.string(),
        email: z.string().nullable(),
        firstName: z.string().nullable(),
        lastName: z.string().nullable(),
        profilePicture: z.string().nullable(),
    })
    .meta({ id: "MemberUser" })

export const memberListItemSchema = z
    .object({
        id: z.string(),
        role: z.enum(["owner", "admin", "member"]),
        createdAt: z.string(),
        user: memberUserSchema,
    })
    .meta({ id: "MemberListItem" })

export const inviteItemSchema = z
    .object({
        id: z.string(),
        email: z.string(),
        role: z.enum(["admin", "member"]),
        status: z.enum(["PENDING", "ACCEPTED", "REVOKED", "EXPIRED"]),
        expiresAt: z.string(),
        createdAt: z.string(),
        invitedBy: memberUserSchema,
        acceptUrl: z.string().optional(),
        token: z.string().optional(),
    })
    .meta({ id: "InviteItem" })

export const invitePreviewSchema = z
    .object({
        organizationName: z.string(),
        role: z.enum(["admin", "member"]),
        email: z.string(),
        expiresAt: z.string(),
        status: z.enum(["PENDING", "ACCEPTED", "REVOKED", "EXPIRED"]),
    })
    .meta({ id: "InvitePreview" })

export const acceptInviteResponseSchema = z
    .object({
        membership: memberListItemSchema,
        organization: z.object({
            id: z.string(),
            name: z.string(),
            slug: z.string(),
        }),
    })
    .meta({ id: "AcceptInviteResponse" })
