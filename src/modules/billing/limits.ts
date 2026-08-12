import type { AIModel, Plan } from "../../generated/prisma/client.js"
import { AppError } from "../../platform/errors.js"
import prismaClient from "../../platform/prisma.js"
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

function startOfUtcMonth(now = new Date()): Date {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0))
}

export async function expireLapsedSubscriptions(organizationId: string) {
    const now = new Date()
    await prismaClient.subscription.updateMany({
        where: {
            organizationId,
            status: "ACTIVE",
            expiresAt: { lte: now },
        },
        data: { status: "EXPIRED" },
    })

    const stillActive = await prismaClient.subscription.findFirst({
        where: { organizationId, status: "ACTIVE" },
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

    const subscription = await prismaClient.subscription.findFirst({
        where: {
            organizationId,
            status: "ACTIVE",
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
 */
export async function assertWithinPlanLimits(organizationId: string): Promise<QuotaSnapshot> {
    const subscription = await getActiveSubscriptionWithPlan(organizationId)
    const { plan } = subscription
    const periodStart = startOfUtcMonth()

    const usage = await prismaClient.aIRequest.aggregate({
        where: {
            project: { organizationId },
            createdAt: { gte: periodStart },
            requestStatus: { in: ["PENDING", "SUCCESS", "FAILED"] },
        },
        _count: { _all: true },
        _sum: { totalTokens: true },
    })

    const requestsUsed = usage._count._all
    const tokensUsed = usage._sum.totalTokens ?? 0

    const enforceRequests = plan.billingMode === "FIXED_MONTHLY" || plan.requestLimit > 0
    const enforceTokens = plan.billingMode === "FIXED_MONTHLY" || plan.tokenLimit > 0

    if (enforceRequests && plan.requestLimit > 0 && requestsUsed >= plan.requestLimit) {
        throw new AppError(
            429,
            "RATE_LIMIT_EXCEEDED",
            `Monthly request limit of ${plan.requestLimit} exceeded`,
        )
    }

    if (enforceTokens && plan.tokenLimit > 0 && tokensUsed >= plan.tokenLimit) {
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
        requestsUsed,
        tokenLimit: plan.tokenLimit,
        tokensUsed,
        periodStart,
    }
}

export function isPlanName(name: string): name is PlanName {
    return name === PLAN_NAMES.free || name === PLAN_NAMES.pro || name === PLAN_NAMES.scale
}
