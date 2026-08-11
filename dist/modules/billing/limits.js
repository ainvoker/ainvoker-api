import { AppError } from "../../platform/errors.js";
import prismaClient from "../../platform/prisma.js";
import { ensureBillingCatalog, PLAN_NAMES } from "./catalog.js";
function startOfUtcMonth(now = new Date()) {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
}
export async function getActiveSubscriptionWithPlan(organizationId) {
    await ensureBillingCatalog();
    const subscription = await prismaClient.subscription.findFirst({
        where: {
            organizationId,
            status: "ACTIVE",
        },
        include: { plan: true },
        orderBy: { startedAt: "desc" },
    });
    if (!subscription) {
        throw new AppError(402, "SUBSCRIPTION_REQUIRED", "Organization has no active subscription");
    }
    return subscription;
}
export function assertModelAllowedForPlan(plan, model) {
    if (plan.name !== PLAN_NAMES.free) {
        return;
    }
    if (!model.freeEligible) {
        throw new AppError(403, "MODEL_NOT_ALLOWED_ON_PLAN", `Model "${model.name}" is not available on the Free plan`);
    }
}
/**
 * Enforce monthly quotas for FIXED_MONTHLY plans.
 * For METERED, only enforce when requestLimit/tokenLimit are > 0 (safety ceilings).
 */
export async function assertWithinPlanLimits(organizationId) {
    const subscription = await getActiveSubscriptionWithPlan(organizationId);
    const { plan } = subscription;
    const periodStart = startOfUtcMonth();
    const usage = await prismaClient.aIRequest.aggregate({
        where: {
            project: { organizationId },
            createdAt: { gte: periodStart },
            requestStatus: { in: ["PENDING", "SUCCESS", "FAILED"] },
        },
        _count: { _all: true },
        _sum: { totalTokens: true },
    });
    const requestsUsed = usage._count._all;
    const tokensUsed = usage._sum.totalTokens ?? 0;
    const enforceRequests = plan.billingMode === "FIXED_MONTHLY" || plan.requestLimit > 0;
    const enforceTokens = plan.billingMode === "FIXED_MONTHLY" || plan.tokenLimit > 0;
    if (enforceRequests && plan.requestLimit > 0 && requestsUsed >= plan.requestLimit) {
        throw new AppError(429, "RATE_LIMIT_EXCEEDED", `Monthly request limit of ${plan.requestLimit} exceeded`);
    }
    if (enforceTokens && plan.tokenLimit > 0 && tokensUsed >= plan.tokenLimit) {
        throw new AppError(429, "RATE_LIMIT_EXCEEDED", `Monthly token limit of ${plan.tokenLimit} exceeded`);
    }
    return {
        planName: plan.name,
        billingMode: plan.billingMode,
        requestLimit: plan.requestLimit,
        requestsUsed,
        tokenLimit: plan.tokenLimit,
        tokensUsed,
        periodStart,
    };
}
export function isPlanName(name) {
    return name === PLAN_NAMES.free || name === PLAN_NAMES.pro || name === PLAN_NAMES.scale;
}
//# sourceMappingURL=limits.js.map