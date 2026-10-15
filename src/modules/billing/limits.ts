import type { AIModel, AIServiceType, Plan, Prisma } from "../../generated/prisma/client.js"
import { AppError } from "../../platform/errors.js"
import prismaClient from "../../platform/prisma.js"
import {
    aggregatePeriodUsage,
    QUOTA_STATUSES,
    startOfNextUtcDay,
    startOfUtcMonth,
} from "../usage/aggregate.js"
import { ensureBillingCatalog, getPlanByName, PLAN_NAMES, type PlanName } from "./catalog.js"
import {
    assertModelAllowedForPlan,
    getOrganizationOwnerUserId,
    isModelEnabledByDefault,
    quotaUnitsForHold,
} from "./quotaHelpers.js"
import { isEntitlementUnexpired, quotaPeriodForSubscription } from "./period.js"

export { assertModelAllowedForPlan }

export type QuotaSnapshot = {
    planName: string
    billingMode: Plan["billingMode"]
    requestLimit: number
    requestsUsed: number
    tokenLimit: number
    tokensUsed: number
    periodStart: Date
}

export { startOfUtcMonth }

type DbClient = Prisma.TransactionClient | typeof prismaClient

export type ReservePendingTextRequestInput = {
    organizationId: string
    projectId: string
    apiKeyId: string
    /** Must already pass assertModelAllowedForPlan; a missing allow row is created enabled. */
    modelId: number
    requestPayload: Prisma.InputJsonValue
    /** Prompt-token ceiling counted against the monthly cap while the row is PENDING. */
    reservedInputTokens: number
    /** Completion-token ceiling. May shrink to the remaining budget when allowOutputShrink is set. */
    reservedOutputTokens: number
    /**
     * True when the caller omitted maxTokens. The output hold can shrink to whatever
     * monthly budget remains. An explicit maxTokens that does not fit is rejected.
     */
    allowOutputShrink: boolean
}

export async function expireLapsedSubscriptions(organizationId: string) {
    const now = new Date()
    const { closeScaleBillingPeriodIfDue } = await import("./scaleWallet.js")
    try {
        await closeScaleBillingPeriodIfDue(organizationId, now)
    } catch {
        // Org may lack entitlement during checkout; ignore.
    }
    await prismaClient.subscription.updateMany({
        where: {
            organizationId,
            status: { in: ["ACTIVE", "PAST_DUE"] },
            expiresAt: { lte: now },
        },
        data: { status: "EXPIRED" },
    })

    const stillActive = await prismaClient.subscription.findFirst({
        where: { organizationId, status: { in: ["ACTIVE", "PAST_DUE"] } },
        select: { id: true },
    })
    if (stillActive) {
        return
    }

    const org = await prismaClient.organization.findUnique({
        where: { id: organizationId },
        select: { slug: true },
    })
    if (!org?.slug.startsWith("personal-")) {
        return
    }

    const freePlan = await getPlanByName(PLAN_NAMES.free)
    const canceledFree = await prismaClient.subscription.findFirst({
        where: {
            organizationId,
            planId: freePlan.id,
            status: "CANCELED",
        },
        orderBy: { startedAt: "desc" },
    })
    if (canceledFree) {
        await prismaClient.subscription.update({
            where: { id: canceledFree.id },
            data: { status: "ACTIVE", expiresAt: null },
        })
        return
    }

    await prismaClient.subscription.create({
        data: {
            organizationId,
            planId: freePlan.id,
            status: "ACTIVE",
            startedAt: new Date(),
        },
    })
}

export async function getActiveSubscriptionWithPlan(organizationId: string) {
    await ensureBillingCatalog()

    // Hot path (every gateway call): skip the expiry writes while the newest subscription is live.
    const current = await findLatestSubscriptionPlan(prismaClient, organizationId)
    if (current && isEntitlementUnexpired(current.expiresAt)) {
        return current
    }

    await expireLapsedSubscriptions(organizationId)
    return loadActiveSubscriptionPlan(prismaClient, organizationId)
}

/**
 * Gate dashboard mutations (create project / API key) until the org is ACTIVE
 * and has an ACTIVE, unexpired subscription. PENDING Pro orgs cannot mutate.
 */
export async function assertOrgCanMutateResources(organizationId: string) {
    const org = await prismaClient.organization.findUnique({
        where: { id: organizationId },
        select: { status: true },
    })

    if (!org || org.status === "DELETED") {
        throw new AppError(404, "NOT_FOUND", "Organization not found")
    }

    if (org.status !== "ACTIVE") {
        throw new AppError(403, "FORBIDDEN", "Organization is not active")
    }

    await getActiveSubscriptionWithPlan(organizationId)
}

/**
 * Enforce monthly quotas for FIXED_MONTHLY plans.
 * For METERED, only enforce when requestLimit/tokenLimit are > 0 (safety ceilings).
 *
 * Callers that insert a request must also reserve that request's tokens on the row.
 * This check only rejects orgs that are already at the cap.
 */
function enforcePlanQuota(
    plan: Pick<Plan, "name" | "billingMode" | "requestLimit" | "tokenLimit">,
    period: {
        requestsUsed: number
        tokensUsed: number
        periodStart: Date
        tokenLimit?: number
    },
): QuotaSnapshot {
    const tokenLimit = period.tokenLimit ?? plan.tokenLimit
    const enforceRequests =
        plan.name === PLAN_NAMES.free ||
        plan.billingMode === "FIXED_MONTHLY" ||
        plan.requestLimit > 0
    const enforceTokens =
        plan.name === PLAN_NAMES.free ||
        plan.billingMode === "FIXED_MONTHLY" ||
        plan.tokenLimit > 0

    if (enforceRequests && plan.requestLimit > 0 && period.requestsUsed >= plan.requestLimit) {
        throw new AppError(
            429,
            "RATE_LIMIT_EXCEEDED",
            `Monthly request limit of ${plan.requestLimit} exceeded`,
        )
    }

    if (enforceTokens && tokenLimit > 0 && period.tokensUsed >= tokenLimit) {
        throw new AppError(
            429,
            "RATE_LIMIT_EXCEEDED",
            `Token limit of ${tokenLimit} exceeded`,
        )
    }

    return {
        planName: plan.name,
        billingMode: plan.billingMode,
        requestLimit: plan.requestLimit,
        requestsUsed: period.requestsUsed,
        tokenLimit,
        tokensUsed: period.tokensUsed,
        periodStart: period.periodStart,
    }
}

function findLatestSubscriptionPlan(db: DbClient, organizationId: string) {
    return db.subscription.findFirst({
        where: {
            organizationId,
            status: { in: ["ACTIVE", "PAST_DUE"] },
        },
        include: { plan: true },
        orderBy: { startedAt: "desc" },
    })
}

async function loadActiveSubscriptionPlan(db: DbClient, organizationId: string) {
    const subscription = await findLatestSubscriptionPlan(db, organizationId)

    if (!subscription || !isEntitlementUnexpired(subscription.expiresAt)) {
        throw new AppError(
            402,
            "SUBSCRIPTION_REQUIRED",
            "Organization has no active subscription",
        )
    }

    return subscription
}

/** Start of the billing period an entitled subscription's quota counts against. */
export function entitledPeriodStart(
    subscription: { status: string; startedAt: Date; expiresAt: Date | null },
    now = new Date(),
): Date {
    return quotaPeriodForSubscription(subscription, now)?.periodStart ?? now
}

async function aggregateOrgQuotaUsage(
    db: DbClient,
    organizationId: string,
    periodStart: Date,
    now = new Date(),
): Promise<{ requestsUsed: number; tokensUsed: number; periodStart: Date }> {
    const quotaAgg = await db.aIRequest.aggregate({
        where: {
            project: { organizationId },
            createdAt: { gte: periodStart, lt: startOfNextUtcDay(now) },
            requestStatus: { in: [...QUOTA_STATUSES] },
        },
        _count: { _all: true },
        _sum: { totalTokens: true, quotaTokens: true },
    })

    const quotaSum = quotaAgg._sum.quotaTokens ?? 0
    const legacySum = quotaAgg._sum.totalTokens ?? 0
    return {
        requestsUsed: quotaAgg._count._all,
        tokensUsed: quotaSum > 0 ? quotaSum : legacySum,
        periodStart,
    }
}

async function sumPendingQuotaUnits(db: DbClient, organizationId: string): Promise<number> {
    const agg = await db.aIRequest.aggregate({
        where: {
            project: { organizationId },
            requestStatus: "PENDING",
        },
        _sum: { quotaTokens: true, totalTokens: true },
    })
    return agg._sum.quotaTokens ?? agg._sum.totalTokens ?? 0
}

async function resolveTokenQuotaForPlan(
    db: DbClient,
    organizationId: string,
    plan: Pick<Plan, "name" | "tokenLimit">,
    periodTokensUsed: number,
): Promise<{ tokensUsed: number; tokenLimit: number }> {
    if (plan.name === PLAN_NAMES.free) {
        const ownerId = await getOrganizationOwnerUserId(organizationId)
        if (!ownerId) {
            return { tokensUsed: periodTokensUsed, tokenLimit: plan.tokenLimit }
        }
        const user = await db.user.findUnique({
            where: { id: ownerId },
            select: { freeQuotaUnitsUsed: true, freeQuotaUnitsLimit: true },
        })
        if (!user) {
            return { tokensUsed: periodTokensUsed, tokenLimit: plan.tokenLimit }
        }
        const pending = await sumPendingQuotaUnits(db, organizationId)
        return {
            tokensUsed: user.freeQuotaUnitsUsed + pending,
            tokenLimit: user.freeQuotaUnitsLimit,
        }
    }
    return { tokensUsed: periodTokensUsed, tokenLimit: plan.tokenLimit }
}

/**
 * Enforce monthly quotas for FIXED_MONTHLY plans.
 * For METERED, only enforce when requestLimit/tokenLimit are > 0 (safety ceilings).
 */
export async function assertWithinPlanLimits(organizationId: string): Promise<QuotaSnapshot> {
    const subscription = await getActiveSubscriptionWithPlan(organizationId)
    const period = await aggregatePeriodUsage(
        { organizationId },
        entitledPeriodStart(subscription),
    )
    return enforcePlanQuota(subscription.plan, period)
}

function tokenLimitApplies(plan: Pick<Plan, "name" | "billingMode" | "tokenLimit">, limit: number): boolean {
    if (plan.name === PLAN_NAMES.scale && plan.billingMode === "METERED" && plan.tokenLimit <= 0) {
        return false
    }
    return limit > 0 && (plan.billingMode === "FIXED_MONTHLY" || plan.tokenLimit > 0 || plan.name === PLAN_NAMES.free)
}

/**
 * Fit this call's token hold into the remaining monthly budget.
 * Explicit maxTokens that does not fit is rejected. An omitted maxTokens shrinks
 * to whatever output budget remains after the input hold.
 */
function fitTokenHold(
    plan: Pick<Plan, "name" | "billingMode" | "tokenLimit">,
    tokensUsed: number,
    tokenLimit: number,
    input: Pick<
        ReservePendingTextRequestInput,
        "reservedInputTokens" | "reservedOutputTokens" | "allowOutputShrink"
    >,
): { inputTokens: number; outputTokens: number } {
    const inputTokens = input.reservedInputTokens
    let outputTokens = input.reservedOutputTokens

    if (!tokenLimitApplies(plan, tokenLimit)) {
        return { inputTokens, outputTokens }
    }

    const remaining = tokenLimit - tokensUsed
    if (inputTokens + outputTokens <= remaining) {
        return { inputTokens, outputTokens }
    }

    const outputBudget = remaining - inputTokens
    if (input.allowOutputShrink && outputBudget >= 1) {
        return { inputTokens, outputTokens: outputBudget }
    }

    throw new AppError(
        429,
        "RATE_LIMIT_EXCEEDED",
        `Token limit of ${tokenLimit} exceeded`,
    )
}

/** Increment lifetime free quota when a Personal free-tier request succeeds. */
export async function recordFreeQuotaUsage(organizationId: string, quotaUnits: number) {
    const subscription = await getActiveSubscriptionWithPlan(organizationId)
    if (subscription.plan.name !== PLAN_NAMES.free) {
        return
    }
    const ownerId = await getOrganizationOwnerUserId(organizationId)
    if (!ownerId) return
    await prismaClient.user.update({
        where: { id: ownerId },
        data: { freeQuotaUnitsUsed: { increment: quotaUnits } },
    })
}

/**
 * Atomically check org quota and insert a PENDING AIRequest with a token hold.
 * Locks the Organization row (FOR UPDATE) so concurrent chats across API
 * instances cannot TOCTOU past monthly request/token caps. The hold is stored
 * on totalTokens so the next caller sees it. Hold the lock only for check +
 * insert — call providers after commit, capped at the reserved output.
 */
export function reservePendingTextRequest(input: ReservePendingTextRequestInput) {
    return reservePendingRequest("TEXT", input)
}

/** Same reserve as text. Image output size cannot be capped, so the hold never shrinks. */
export function reservePendingImageRequest(
    input: Omit<ReservePendingTextRequestInput, "allowOutputShrink">,
) {
    return reservePendingRequest("IMAGE", { ...input, allowOutputShrink: false })
}

async function reservePendingRequest(
    serviceType: AIServiceType,
    input: ReservePendingTextRequestInput,
): Promise<{
    aiRequest: { id: string }
    quota: QuotaSnapshot
    tokenHold: { inputTokens: number; outputTokens: number }
}> {
    return prismaClient.$transaction(async (tx) => {
        // Serialize quota check+insert per org across API processes (TOCTOU / multi-instance).
        await tx.$queryRaw`SELECT id FROM "Organization" WHERE id = ${input.organizationId} FOR UPDATE`

        const model = await tx.aIModel.findUniqueOrThrow({
            where: { id: input.modelId },
            select: { inputPrice: true, outputPrice: true, planTier: true },
        })

        // Backfill this model only; skipDuplicates keeps an existing row's enabled state.
        await tx.projectModelAllow.createMany({
            data: [
                {
                    projectId: input.projectId,
                    modelId: input.modelId,
                    enabled: isModelEnabledByDefault(model),
                },
            ],
            skipDuplicates: true,
        })

        const allow = await tx.projectModelAllow.findUnique({
            where: {
                projectId_modelId: {
                    projectId: input.projectId,
                    modelId: input.modelId,
                },
            },
            select: { enabled: true },
        })
        if (!allow || !allow.enabled) {
            throw new AppError(
                403,
                "MODEL_DISABLED",
                "This model is disabled for the project",
            )
        }

        const subscription = await loadActiveSubscriptionPlan(tx, input.organizationId)
        const periodStart = entitledPeriodStart(subscription)
        const period = await aggregateOrgQuotaUsage(tx, input.organizationId, periodStart)
        const tokenQuota = await resolveTokenQuotaForPlan(
            tx,
            input.organizationId,
            subscription.plan,
            period.tokensUsed,
        )
        const quota = enforcePlanQuota(subscription.plan, {
            ...period,
            tokensUsed: tokenQuota.tokensUsed,
            tokenLimit: tokenQuota.tokenLimit,
        })
        const tokenHold = fitTokenHold(
            subscription.plan,
            tokenQuota.tokensUsed,
            tokenQuota.tokenLimit,
            input,
        )

        const holdQuotaUnits = await quotaUnitsForHold(
            model,
            tokenHold.inputTokens,
            tokenHold.outputTokens,
        )

        const aiRequest = await tx.aIRequest.create({
            data: {
                projectId: input.projectId,
                apiKeyId: input.apiKeyId,
                modelId: input.modelId,
                serviceType,
                requestPayload: input.requestPayload,
                requestStatus: "PENDING",
                inputTokens: tokenHold.inputTokens,
                outputTokens: tokenHold.outputTokens,
                totalTokens: tokenHold.inputTokens + tokenHold.outputTokens,
                quotaTokens: holdQuotaUnits,
            },
            select: { id: true },
        })

        return { aiRequest, quota, tokenHold }
    })
}

export function isPlanName(name: string): name is PlanName {
    return name === PLAN_NAMES.free || name === PLAN_NAMES.pro || name === PLAN_NAMES.scale
}
