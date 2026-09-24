import type { AIModel, Plan, Prisma } from "../../generated/prisma/client.js"
import { AppError } from "../../platform/errors.js"
import prismaClient from "../../platform/prisma.js"
import {
    aggregatePeriodUsage,
    QUOTA_STATUSES,
    startOfNextUtcDay,
    startOfUtcMonth,
} from "../usage/aggregate.js"
import { ensureBillingCatalog, getPlanByName, PLAN_NAMES, type PlanName } from "./catalog.js"
import { isEntitlementUnexpired } from "./period.js"

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
    modelId: number
    requestPayload: Prisma.InputJsonValue
}

export async function expireLapsedSubscriptions(organizationId: string) {
    const now = new Date()
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

export function assertModelAllowedForPlan(
    plan: Pick<Plan, "name">,
    model: Pick<AIModel, "freeEligible" | "name">,
) {
    if (plan.name !== PLAN_NAMES.free) {
        return
    }

    if (!model.freeEligible) {
        throw new AppError(
            403,
            "MODEL_NOT_ALLOWED_ON_PLAN",
            `Model "${model.name}" is not available on the Free plan`,
        )
    }
}

/**
 * Enforce monthly quotas for FIXED_MONTHLY plans.
 * For METERED, only enforce when requestLimit/tokenLimit are > 0 (safety ceilings).
 *
 * Token caps use pre-call aggregates: PENDING rows usually have null totalTokens, so
 * concurrent in-flight calls can still pass a token ceiling until usage is written.
 */
function enforcePlanQuota(
    plan: Pick<Plan, "name" | "billingMode" | "requestLimit" | "tokenLimit">,
    period: { requestsUsed: number; tokensUsed: number; periodStart: Date },
): QuotaSnapshot {
    const enforceRequests = plan.billingMode === "FIXED_MONTHLY" || plan.requestLimit > 0
    const enforceTokens = plan.billingMode === "FIXED_MONTHLY" || plan.tokenLimit > 0

    if (enforceRequests && plan.requestLimit > 0 && period.requestsUsed >= plan.requestLimit) {
        throw new AppError(
            429,
            "RATE_LIMIT_EXCEEDED",
            `Monthly request limit of ${plan.requestLimit} exceeded`,
        )
    }

    if (enforceTokens && plan.tokenLimit > 0 && period.tokensUsed >= plan.tokenLimit) {
        throw new AppError(
            429,
            "RATE_LIMIT_EXCEEDED",
            `Monthly token limit of ${plan.tokenLimit} exceeded`,
        )
    }

    return {
        planName: plan.name,
        billingMode: plan.billingMode,
        requestLimit: plan.requestLimit,
        requestsUsed: period.requestsUsed,
        tokenLimit: plan.tokenLimit,
        tokensUsed: period.tokensUsed,
        periodStart: period.periodStart,
    }
}

async function loadActiveSubscriptionPlan(db: DbClient, organizationId: string) {
    const subscription = await db.subscription.findFirst({
        where: {
            organizationId,
            status: { in: ["ACTIVE", "PAST_DUE"] },
        },
        include: { plan: true },
        orderBy: { startedAt: "desc" },
    })

    if (!subscription || !isEntitlementUnexpired(subscription.expiresAt)) {
        throw new AppError(
            402,
            "SUBSCRIPTION_REQUIRED",
            "Organization has no active subscription",
        )
    }

    return subscription
}

async function aggregateOrgQuotaUsage(
    db: DbClient,
    organizationId: string,
    periodStart = startOfUtcMonth(),
    now = new Date(),
): Promise<{ requestsUsed: number; tokensUsed: number; periodStart: Date }> {
    const quotaAgg = await db.aIRequest.aggregate({
        where: {
            project: { organizationId },
            createdAt: { gte: periodStart, lt: startOfNextUtcDay(now) },
            requestStatus: { in: [...QUOTA_STATUSES] },
        },
        _count: { _all: true },
        _sum: { totalTokens: true },
    })

    return {
        requestsUsed: quotaAgg._count._all,
        tokensUsed: quotaAgg._sum.totalTokens ?? 0,
        periodStart,
    }
}

/**
 * Enforce monthly quotas for FIXED_MONTHLY plans.
 * For METERED, only enforce when requestLimit/tokenLimit are > 0 (safety ceilings).
 */
export async function assertWithinPlanLimits(organizationId: string): Promise<QuotaSnapshot> {
    const subscription = await getActiveSubscriptionWithPlan(organizationId)
    const period = await aggregatePeriodUsage({ organizationId })
    return enforcePlanQuota(subscription.plan, period)
}

/**
 * Atomically check org quota and insert a PENDING AIRequest.
 * Locks the Organization row (FOR UPDATE) so concurrent chats across API
 * instances cannot TOCTOU past monthly request/token caps. Hold the lock only
 * for check + insert — call providers after commit.
 */
export async function reservePendingTextRequest(input: ReservePendingTextRequestInput): Promise<{
    aiRequest: { id: string }
    quota: QuotaSnapshot
}> {
    return prismaClient.$transaction(async (tx) => {
        // Serialize quota check+insert per org across API processes (TOCTOU / multi-instance).
        await tx.$queryRaw`SELECT id FROM "Organization" WHERE id = ${input.organizationId} FOR UPDATE`

        const subscription = await loadActiveSubscriptionPlan(tx, input.organizationId)
        const period = await aggregateOrgQuotaUsage(tx, input.organizationId)
        const quota = enforcePlanQuota(subscription.plan, period)

        const aiRequest = await tx.aIRequest.create({
            data: {
                projectId: input.projectId,
                apiKeyId: input.apiKeyId,
                modelId: input.modelId,
                serviceType: "TEXT",
                requestPayload: input.requestPayload,
                requestStatus: "PENDING",
            },
            select: { id: true },
        })

        return { aiRequest, quota }
    })
}

export function isPlanName(name: string): name is PlanName {
    return name === PLAN_NAMES.free || name === PLAN_NAMES.pro || name === PLAN_NAMES.scale
}
