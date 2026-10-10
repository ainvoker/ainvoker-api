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

export const projectModelSchema = z
    .object({
        id: z.number().int(),
        provider: z.string(),
        name: z.string(),
        slug: z.string(),
        type: z.enum(["TEXT", "IMAGE"]),
        contextWindow: z.number().int(),
        freeEligible: z.boolean(),
        enabled: z.boolean(),
        locked: z.boolean(),
    })
    .meta({ id: "ProjectModel" })

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

export const projectAnalyticsPeriodSchema = usagePeriodSchema
    .extend({
        inputTokens: z.number().int(),
        outputTokens: z.number().int(),
        totalCost: z.string().describe("Decimal string, sum of request costs in USD"),
    })
    .meta({ id: "ProjectAnalyticsPeriod" })

export const projectLatencyStatsSchema = z
    .object({
        avg: z.number().int().nullable(),
        p50: z.number().int().nullable(),
        p95: z.number().int().nullable(),
    })
    .meta({ id: "ProjectLatencyStats" })

export const apiKeyUsageRowSchema = z
    .object({
        apiKeyId: z.string(),
        keyName: z.string(),
        keyPrefix: z.string(),
        requestsUsed: z.number().int(),
        tokensUsed: z.number().int(),
    })
    .meta({ id: "ApiKeyUsageRow" })

export const projectAnalyticsSchema = z
    .object({
        range: z.enum(["billing_month", "7d", "30d"]),
        project: z.object({
            id: z.string(),
            organizationId: z.string(),
            name: z.string(),
        }),
        plan: usagePlanSnapshotSchema.nullable(),
        period: projectAnalyticsPeriodSchema,
        latency: projectLatencyStatsSchema,
        organizationPeriod: usagePeriodSchema,
        byModel: z.array(orgUsageByModelSchema),
        byApiKey: z.array(apiKeyUsageRowSchema),
        daily: z.array(usageDailyPointSchema),
        dailyByModel: z.array(usageDailySegmentPointSchema),
        dailyByApiKey: z.array(usageDailySegmentPointSchema),
        recentRequests: z.array(aiRequestSummarySchema),
    })
    .meta({ id: "ProjectAnalytics" })

const providerMetadataSchema = z
    .record(z.string(), z.unknown())
    .optional()
    .describe(
        "Opaque vendor data (for example the Gemini thought signature). Send it back unchanged with the call.",
    )

export const chatToolCallSchema = z
    .object({
        id: z.string(),
        name: z.string(),
        arguments: z.record(z.string(), z.unknown()),
        providerMetadata: providerMetadataSchema,
    })
    .meta({ id: "ChatToolCall" })

/** Assistant reply. content is "" on a tool-only reply; text-only replies omit toolCalls. */
export const chatMessageSchema = z
    .object({
        role: z.literal("assistant"),
        content: z.string(),
        toolCalls: z.array(chatToolCallSchema).optional(),
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

export const generatedImageSchema = z
    .object({
        base64: z.string().describe("Image bytes, base64-encoded (no data: prefix)"),
        mimeType: z.string(),
        revisedPrompt: z.string().optional(),
    })
    .meta({ id: "GeneratedImage" })

export const imageGenerateResponseSchema = z
    .object({
        id: z.string(),
        model: z.string(),
        images: z.array(generatedImageSchema),
        usage: chatUsageSchema.nullable(),
    })
    .meta({ id: "ImageGenerateResponse" })

export const textStreamMetaEventSchema = z
    .object({
        id: z.string(),
        model: z.string(),
    })
    .meta({ id: "TextStreamMetaEvent" })

export const textStreamDeltaEventSchema = z
    .object({
        content: z.string(),
    })
    .meta({ id: "TextStreamDeltaEvent" })

export const textStreamToolCallEventSchema = z
    .object({
        id: z.string(),
        name: z.string(),
        arguments: z.record(z.string(), z.unknown()),
        providerMetadata: providerMetadataSchema,
    })
    .meta({ id: "TextStreamToolCallEvent" })

export const textStreamDoneEventSchema = z
    .object({
        message: chatMessageSchema,
        usage: chatUsageSchema.nullable(),
    })
    .meta({ id: "TextStreamDoneEvent" })

export const textStreamErrorEventSchema = z
    .object({
        code: z.string(),
        message: z.string(),
    })
    .meta({ id: "TextStreamErrorEvent" })

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

export const inviteDeliverySchema = z
    .object({
        channel: z.enum(["email", "manual"]),
        status: z.enum(["sent", "returned"]),
    })
    .meta({ id: "InviteDelivery" })

export const inviteItemSchema = z
    .object({
        id: z.string(),
        email: z.string(),
        role: z.enum(["admin", "member"]),
        status: z.enum(["PENDING", "ACCEPTED", "REVOKED", "EXPIRED"]),
        expiresAt: z.string(),
        createdAt: z.string(),
        invitedBy: memberUserSchema,
        /**
         * Present only when INVITE_RETURN_ACCEPT_URL=true (local/dev).
         * Omitted after a successful email send. The raw token is never returned.
         */
        acceptUrl: z.string().optional(),
        delivery: inviteDeliverySchema.optional(),
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
