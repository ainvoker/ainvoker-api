import { z } from "zod"
import { apiKeyPermissionsSchema } from "../modules/apiKeys/permissions.js"
import { apiKeyClientTypeSchema } from "../modules/apiKeys/schemas.js"

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
        isPlatformAdmin: z.boolean(),
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
        permissions: apiKeyPermissionsSchema
            .nullable()
            .describe(
                "Gateway permissions. A category (`text`) grants all its features; a feature (`text.chat`) grants one endpoint. `null` means unrestricted.",
            ),
        lastUsed: z.string().nullable(),
        expiresAt: z.string().nullable(),
        status: z.string(),
        clientType: apiKeyClientTypeSchema.describe(
            "`SERVER` keys only work without an `Origin` header; `BROWSER` keys only work from an allowed app URL.",
        ),
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

const catalogStatusSchema = z.enum(["ACTIVE", "INACTIVE", "DEPRECATED"])

export const adminProviderSchema = z
    .object({
        id: z.number().int(),
        name: z.string(),
        baseUrl: z.string(),
        documentation: z.string().nullable(),
        status: catalogStatusSchema,
        hasTextAdapter: z.boolean(),
        hasImageAdapter: z.boolean(),
    })
    .meta({ id: "AdminProvider" })

export const adminModelSchema = z
    .object({
        id: z.number().int(),
        providerId: z.number().int(),
        provider: z.string(),
        name: z.string(),
        slug: z.string(),
        type: z.enum(["TEXT", "IMAGE", "AUDIO", "MULTIMODAL", "EMBEDDING", "OTHER"]),
        contextWindow: z.number().int(),
        inputPrice: z.string().describe("USD per 1M input tokens (decimal string)"),
        outputPrice: z.string().describe("USD per 1M output tokens (decimal string)"),
        status: catalogStatusSchema,
        freeEligible: z.boolean(),
        routable: z
            .boolean()
            .describe("False when no provider adapter is deployed for this provider and type"),
        createdAt: z.string(),
        updatedAt: z.string(),
    })
    .meta({ id: "AdminModel" })

const adminUserSummarySchema = z.object({
    id: z.string(),
    email: z.string().nullable(),
    firstName: z.string().nullable(),
    lastName: z.string().nullable(),
})

const adminSubscriptionSnapshotSchema = z
    .object({
        id: z.string(),
        status: z.string(),
        planName: z.string(),
        expiresAt: z.string().nullable(),
        cancelAtPeriodEnd: z.boolean(),
    })
    .nullable()

export const adminOrganizationListItemSchema = z
    .object({
        id: z.string(),
        name: z.string(),
        slug: z.string(),
        status: z.enum(["ACTIVE", "SUSPENDED", "DELETED"]),
        isPersonal: z.boolean(),
        owner: adminUserSummarySchema.nullable(),
        memberCount: z.number().int(),
        planName: z.string().nullable(),
        subscriptionStatus: z.string().nullable(),
        createdAt: z.string(),
        updatedAt: z.string(),
    })
    .meta({ id: "AdminOrganizationListItem" })

export const adminOrganizationListSchema = z
    .object({
        items: z.array(adminOrganizationListItemSchema),
        total: z.number().int(),
        limit: z.number().int(),
        offset: z.number().int(),
    })
    .meta({ id: "AdminOrganizationList" })

export const adminOrganizationDetailSchema = z
    .object({
        id: z.string(),
        name: z.string(),
        slug: z.string(),
        status: z.enum(["ACTIVE", "SUSPENDED", "DELETED"]),
        isPersonal: z.boolean(),
        owner: adminUserSummarySchema.nullable(),
        memberCount: z.number().int(),
        subscription: adminSubscriptionSnapshotSchema,
        projects: z.array(
            z.object({
                id: z.string(),
                name: z.string(),
                environment: z.string(),
                status: z.string(),
                apiKeyCount: z.number().int(),
                createdAt: z.string(),
                updatedAt: z.string(),
            }),
        ),
        apiKeys: z.array(
            z.object({
                id: z.string(),
                projectId: z.string(),
                projectName: z.string(),
                keyName: z.string(),
                keyPrefix: z.string(),
                status: z.string(),
                clientType: z.string(),
                lastUsed: z.string().nullable(),
                createdAt: z.string(),
            }),
        ),
        invites: z.array(
            z.object({
                id: z.string(),
                email: z.string(),
                role: z.string(),
                status: z.string(),
                expiresAt: z.string(),
                createdAt: z.string(),
            }),
        ),
        createdAt: z.string(),
        updatedAt: z.string(),
    })
    .meta({ id: "AdminOrganizationDetail" })

export const adminUserListItemSchema = z
    .object({
        id: z.string(),
        email: z.string().nullable(),
        firstName: z.string().nullable(),
        lastName: z.string().nullable(),
        profilePicture: z.string().nullable(),
        isPlatformAdmin: z.boolean(),
        membershipCount: z.number().int(),
        createdAt: z.string(),
        updatedAt: z.string(),
    })
    .meta({ id: "AdminUserListItem" })

export const adminUserListSchema = z
    .object({
        items: z.array(adminUserListItemSchema),
        total: z.number().int(),
        limit: z.number().int(),
        offset: z.number().int(),
    })
    .meta({ id: "AdminUserList" })

export const adminUserDetailSchema = z
    .object({
        id: z.string(),
        email: z.string().nullable(),
        firstName: z.string().nullable(),
        lastName: z.string().nullable(),
        profilePicture: z.string().nullable(),
        themePreference: z.enum(["LIGHT", "DARK", "DEVICE"]),
        freeQuotaUnitsUsed: z.number().int(),
        freeQuotaUnitsLimit: z.number().int(),
        isPlatformAdmin: z.boolean(),
        memberships: z.array(
            z.object({
                id: z.string(),
                role: z.string(),
                organization: z.object({
                    id: z.string(),
                    name: z.string(),
                    slug: z.string(),
                    status: z.enum(["ACTIVE", "SUSPENDED", "DELETED"]),
                    isPersonal: z.boolean(),
                    createdAt: z.string(),
                }),
                createdAt: z.string(),
            }),
        ),
        createdAt: z.string(),
        updatedAt: z.string(),
    })
    .meta({ id: "AdminUserDetail" })

const adminOrgRefSchema = z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
})

export const adminPlanSchema = z
    .object({
        id: z.number().int(),
        name: z.string(),
        monthlyPrice: z.string(),
        priceNote: z.string().nullable(),
        tokenLimit: z.number().int(),
        requestLimit: z.number().int(),
        billingMode: z.string(),
        description: z.string().nullable(),
    })
    .meta({ id: "AdminPlan" })

export const adminSubscriptionItemSchema = z
    .object({
        id: z.string(),
        organization: adminOrgRefSchema,
        planName: z.string(),
        status: z.string(),
        startedAt: z.string(),
        expiresAt: z.string().nullable(),
        cancelAtPeriodEnd: z.boolean(),
        xenditRecurringPlanId: z.string().nullable(),
        updatedAt: z.string(),
    })
    .meta({ id: "AdminSubscriptionItem" })

export const adminSubscriptionListSchema = z
    .object({
        items: z.array(adminSubscriptionItemSchema),
        total: z.number().int(),
        limit: z.number().int(),
        offset: z.number().int(),
    })
    .meta({ id: "AdminSubscriptionList" })

export const adminTransactionItemSchema = z
    .object({
        id: z.string(),
        amount: z.string(),
        paymentMethod: z.string(),
        referenceNumber: z.string(),
        paymentStatus: z.string(),
        description: z.string().nullable(),
        receiptUrl: z.string().nullable(),
        createdAt: z.string(),
        organization: adminOrgRefSchema,
        planName: z.string(),
        subscriptionId: z.string(),
    })
    .meta({ id: "AdminTransactionItem" })

export const adminTransactionListSchema = z
    .object({
        items: z.array(adminTransactionItemSchema),
        total: z.number().int(),
        limit: z.number().int(),
        offset: z.number().int(),
    })
    .meta({ id: "AdminTransactionList" })

export const adminAuditEventItemSchema = z
    .object({
        id: z.string(),
        actorUserId: z.string().nullable(),
        actorType: z.enum(["USER", "PLATFORM_ADMIN"]),
        actor: z
            .object({
                id: z.string(),
                email: z.string().nullable(),
                firstName: z.string().nullable(),
                lastName: z.string().nullable(),
            })
            .nullable(),
        action: z.string(),
        targetType: z.string(),
        targetId: z.string().nullable(),
        organizationId: z.string().nullable(),
        summary: z.string(),
        metadata: z.unknown().nullable(),
        createdAt: z.string(),
    })
    .meta({ id: "AdminAuditEventItem" })

export const adminAuditEventListSchema = z
    .object({
        items: z.array(adminAuditEventItemSchema),
        total: z.number().int(),
        limit: z.number().int(),
        offset: z.number().int(),
    })
    .meta({ id: "AdminAuditEventList" })

export const adminUsageTotalsSchema = z
    .object({
        requests: z.number().int(),
        successfulRequests: z.number().int(),
        failedRequests: z.number().int(),
        tokensUsed: z.number().int(),
        totalCost: z.string(),
        errorRate: z.number(),
        avgLatency: z.number().int().nullable(),
        p50Latency: z.number().int().nullable(),
        p95Latency: z.number().int().nullable(),
    })
    .meta({ id: "AdminUsageTotals" })

export const adminUsageOrgRowSchema = z
    .object({
        organizationId: z.string(),
        organizationName: z.string(),
        organizationSlug: z.string(),
        requestsUsed: z.number().int(),
        tokensUsed: z.number().int(),
        totalCost: z.string(),
    })
    .meta({ id: "AdminUsageOrgRow" })

export const adminUsageModelRowSchema = z
    .object({
        modelId: z.number().int(),
        model: z.string(),
        providerName: z.string(),
        requestsUsed: z.number().int(),
        tokensUsed: z.number().int(),
        totalCost: z.string(),
    })
    .meta({ id: "AdminUsageModelRow" })

export const adminUsageProviderRowSchema = z
    .object({
        providerId: z.number().int(),
        providerName: z.string(),
        requestsUsed: z.number().int(),
        tokensUsed: z.number().int(),
        totalCost: z.string(),
    })
    .meta({ id: "AdminUsageProviderRow" })

export const adminUsageNearLimitRowSchema = z
    .object({
        organizationId: z.string(),
        organizationName: z.string(),
        organizationSlug: z.string(),
        planName: z.string(),
        requestsUsed: z.number().int(),
        requestLimit: z.number().int(),
        requestsPct: z.number().nullable(),
        tokensUsed: z.number().int(),
        tokenLimit: z.number().int(),
        tokensPct: z.number().nullable(),
    })
    .meta({ id: "AdminUsageNearLimitRow" })

export const adminUsageOverviewSchema = z
    .object({
        period: z.string(),
        periodStart: z.string(),
        periodEnd: z.string(),
        totals: adminUsageTotalsSchema,
        byOrganization: z.array(adminUsageOrgRowSchema),
        byModel: z.array(adminUsageModelRowSchema),
        byProvider: z.array(adminUsageProviderRowSchema),
        nearLimit: z.array(adminUsageNearLimitRowSchema),
    })
    .meta({ id: "AdminUsageOverview" })

export const adminAiRequestSummarySchema = z
    .object({
        id: z.string(),
        projectId: z.string(),
        projectName: z.string(),
        organizationId: z.string(),
        organizationName: z.string(),
        organizationSlug: z.string(),
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
    .meta({ id: "AdminAiRequestSummary" })

export const adminAiRequestListSchema = z
    .object({
        items: z.array(adminAiRequestSummarySchema),
        total: z.number().int(),
        limit: z.number().int(),
        offset: z.number().int(),
    })
    .meta({ id: "AdminAiRequestList" })

export const adminAiRequestDetailSchema = adminAiRequestSummarySchema
    .extend({
        requestPayload: z.unknown(),
        responsePayload: z.unknown().nullable(),
    })
    .meta({ id: "AdminAiRequestDetail" })

export const adminApiKeyItemSchema = z
    .object({
        id: z.string(),
        keyName: z.string(),
        keyPrefix: z.string(),
        status: z.string(),
        clientType: z.string(),
        lastUsed: z.string().nullable(),
        createdAt: z.string(),
        projectId: z.string(),
        projectName: z.string(),
        organizationId: z.string(),
        organizationName: z.string(),
        organizationSlug: z.string(),
    })
    .meta({ id: "AdminApiKeyItem" })

export const adminApiKeyListSchema = z
    .object({
        items: z.array(adminApiKeyItemSchema),
        total: z.number().int(),
        limit: z.number().int(),
        offset: z.number().int(),
    })
    .meta({ id: "AdminApiKeyList" })

export const adminProjectItemSchema = z
    .object({
        id: z.string(),
        name: z.string(),
        environment: z.string(),
        status: z.string(),
        apiKeyCount: z.number().int(),
        createdAt: z.string(),
        updatedAt: z.string(),
        organizationId: z.string(),
        organizationName: z.string(),
        organizationSlug: z.string(),
    })
    .meta({ id: "AdminProjectItem" })

export const adminProjectListSchema = z
    .object({
        items: z.array(adminProjectItemSchema),
        total: z.number().int(),
        limit: z.number().int(),
        offset: z.number().int(),
    })
    .meta({ id: "AdminProjectList" })

export const adminFinanceOverviewSchema = z
    .object({
        period: z.string(),
        periodStart: z.string(),
        periodEnd: z.string(),
        usdToPhpRate: z.string(),
        cashCollectedPhp: z.string(),
        usageRetailUsd: z.string(),
        usageRetailPhp: z.string(),
        providerCogsUsd: z.string(),
        providerCogsPhp: z.string(),
        expensesPhp: z.string(),
        grossMarginPhp: z.string(),
        netProfitPhp: z.string(),
        requestCount: z.number().int(),
    })
    .meta({ id: "AdminFinanceOverview" })

export const adminFinanceMarginByPlanItemSchema = z
    .object({
        planName: z.string(),
        cashCollectedPhp: z.string(),
        usageRetailUsd: z.string(),
        usageRetailPhp: z.string(),
        providerCogsUsd: z.string(),
        providerCogsPhp: z.string(),
        grossMarginPhp: z.string(),
        requestCount: z.number().int(),
    })
    .meta({ id: "AdminFinanceMarginByPlanItem" })

export const adminFinanceMarginByPlanSchema = z
    .object({
        period: z.string(),
        usdToPhpRate: z.string(),
        items: z.array(adminFinanceMarginByPlanItemSchema),
    })
    .meta({ id: "AdminFinanceMarginByPlan" })

export const adminDashboardDailyPointSchema = z
    .object({
        date: z.string(),
        requestsUsed: z.number().int(),
        tokensUsed: z.number().int(),
        successfulRequests: z.number().int(),
        failedRequests: z.number().int(),
        totalCost: z.string(),
        avgLatency: z.number().int().nullable(),
        p95Latency: z.number().int().nullable(),
    })
    .meta({ id: "AdminDashboardDailyPoint" })

export const adminDashboardMonthlyFinanceSchema = z
    .object({
        period: z.string(),
        cashCollectedPhp: z.string(),
        providerCogsUsd: z.string(),
        providerCogsPhp: z.string(),
        expensesPhp: z.string(),
        grossMarginPhp: z.string(),
        netProfitPhp: z.string(),
        usageRetailUsd: z.string(),
        usageRetailPhp: z.string(),
        requestCount: z.number().int(),
    })
    .meta({ id: "AdminDashboardMonthlyFinance" })

export const adminDashboardSchema = z
    .object({
        period: z.string(),
        months: z.number().int(),
        periodStart: z.string(),
        periodEnd: z.string(),
        apiStatus: z.literal("ok"),
        usage: z.object({
            totals: adminUsageTotalsSchema,
            daily: z.array(adminDashboardDailyPointSchema),
            byProvider: z.array(adminUsageProviderRowSchema),
            nearLimit: z.array(adminUsageNearLimitRowSchema),
        }),
        finance: z.object({
            usdToPhpRate: z.string(),
            overview: z.object({
                cashCollectedPhp: z.string(),
                usageRetailUsd: z.string(),
                usageRetailPhp: z.string(),
                providerCogsUsd: z.string(),
                providerCogsPhp: z.string(),
                expensesPhp: z.string(),
                grossMarginPhp: z.string(),
                netProfitPhp: z.string(),
                requestCount: z.number().int(),
            }),
            monthly: z.array(adminDashboardMonthlyFinanceSchema),
            marginByPlan: z.array(adminFinanceMarginByPlanItemSchema),
        }),
    })
    .meta({ id: "AdminDashboard" })

export const adminFinanceExpenseSchema = z
    .object({
        id: z.string(),
        category: z.string(),
        amountPhp: z.string(),
        period: z.string(),
        description: z.string(),
        notes: z.string().nullable(),
        createdAt: z.string(),
        updatedAt: z.string(),
    })
    .meta({ id: "AdminFinanceExpense" })

export const adminFinanceExpenseListSchema = z
    .object({
        items: z.array(adminFinanceExpenseSchema),
    })
    .meta({ id: "AdminFinanceExpenseList" })

export const adminFinanceReconciliationRunSchema = z
    .object({
        id: z.string(),
        kind: z.string(),
        period: z.string(),
        filename: z.string().nullable(),
        rowCount: z.number().int(),
        matchedCount: z.number().int(),
        driftCount: z.number().int(),
        summary: z.unknown(),
        createdAt: z.string(),
    })
    .meta({ id: "AdminFinanceReconciliationRun" })

export const adminFinanceXenditReconciliationSchema = z
    .object({
        period: z.string(),
        internal: z.object({
            transactionCount: z.number().int(),
            totalPhp: z.string(),
        }),
        latestRun: adminFinanceReconciliationRunSchema.nullable(),
    })
    .meta({ id: "AdminFinanceXenditReconciliation" })

export const adminFinanceProviderReconciliationSchema = z
    .object({
        period: z.string(),
        usdToPhpRate: z.string(),
        internal: z.object({
            providers: z.array(
                z.object({
                    provider: z.string(),
                    amountUsd: z.string(),
                    amountPhp: z.string(),
                }),
            ),
            totalUsd: z.string(),
            totalPhp: z.string(),
        }),
        latestRun: adminFinanceReconciliationRunSchema.nullable(),
    })
    .meta({ id: "AdminFinanceProviderReconciliation" })

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
        entitled: z
            .boolean()
            .describe("False for PENDING or lapsed plans; limits are then zero"),
        requestLimit: z.number().int(),
        tokenLimit: z.number().int(),
        expiresAt: z.string().nullable(),
        periodStart: z.string().nullable().describe("Current billing period start"),
        periodEnd: z.string().nullable().describe("Current billing period end (exclusive)"),
    })
    .meta({ id: "UsagePlanSnapshot" })

export const usagePeriodSchema = z
    .object({
        requestsUsed: z.number().int(),
        tokensUsed: z.number().int(),
        successfulRequests: z.number().int(),
        failedRequests: z.number().int(),
        periodStart: z.string(),
        periodEnd: z.string().describe("Exclusive end; may be in the future"),
    })
    .meta({ id: "UsagePeriod" })

const usageRangeSchema = z.enum(["current_period", "7d", "30d", "calendar_month", "custom"])
const availableMonthsSchema = z
    .array(z.string())
    .describe("UTC YYYY-MM months overlapping any paid or active subscription, newest first")

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
        range: usageRangeSchema,
        availableMonths: availableMonthsSchema,
        quota: usagePeriodSchema
            .nullable()
            .describe("Usage in the current billing period; null when the plan is not entitled"),
        period: usagePeriodSchema.describe("Usage in the selected range"),
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
        range: usageRangeSchema,
        availableMonths: availableMonthsSchema,
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
