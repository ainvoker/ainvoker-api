import { ensureBusinessSettings } from "../business/retail.js"
import prismaClient from "../../platform/prisma.js"
import { PLAN_NAMES } from "./catalog.js"
import { entitledPeriodStart, getActiveSubscriptionWithPlan } from "./limits.js"
import { proRenewsAt } from "./period.js"
import { startOfNextUtcDay } from "../usage/aggregate.js"

/** Billable usage USD for Scale org in current period (SUCCESS rows, retail requestCost). */
export async function scalePeriodUsageUsd(organizationId: string, now = new Date()): Promise<number> {
    const subscription = await getActiveSubscriptionWithPlan(organizationId)
    if (subscription.plan.name !== PLAN_NAMES.scale) {
        return 0
    }
    const periodStart = entitledPeriodStart(subscription, now)
    const agg = await prismaClient.aIRequest.aggregate({
        where: {
            project: { organizationId },
            requestStatus: "SUCCESS",
            createdAt: { gte: periodStart, lt: startOfNextUtcDay(now) },
        },
        _sum: { requestCost: true, quotaTokens: true },
    })
    return Number(agg._sum.requestCost ?? 0)
}

export async function scalePeriodUsagePhp(organizationId: string, now = new Date()): Promise<number> {
    const settings = await ensureBusinessSettings()
    const usd = await scalePeriodUsageUsd(organizationId, now)
    return Math.ceil(usd * Number(settings.usdToPhpRate))
}

export type ScaleSettlementPreview = {
    walletCentavos: number
    usagePhp: number
    chargePhp: number
    walletAfterCentavos: number
}

/**
 * Monthly settle: usage draws wallet; excess + advance refresh when usage > wallet.
 * Returns charge amount in PHP (whole pesos) for saved payment method.
 */
export async function previewScaleSettlement(
    organizationId: string,
    usagePhp: number,
): Promise<ScaleSettlementPreview> {
    const settings = await ensureBusinessSettings()
    const org = await prismaClient.organization.findUniqueOrThrow({
        where: { id: organizationId },
        select: { scaleWalletBalanceCentavos: true },
    })
    const walletPhp = org.scaleWalletBalanceCentavos / 100
    if (usagePhp <= walletPhp) {
        return {
            walletCentavos: Math.round((walletPhp - usagePhp) * 100),
            usagePhp,
            chargePhp: 0,
            walletAfterCentavos: Math.round((walletPhp - usagePhp) * 100),
        }
    }
    const excess = usagePhp - walletPhp
    const advancePhp = settings.scaleAdvanceCentavos / 100
    return {
        walletCentavos: org.scaleWalletBalanceCentavos,
        usagePhp,
        chargePhp: excess + advancePhp,
        walletAfterCentavos: settings.scaleAdvanceCentavos,
    }
}

export async function applyScaleSettlement(organizationId: string, usagePhp: number) {
    const preview = await previewScaleSettlement(organizationId, usagePhp)
    await prismaClient.organization.update({
        where: { id: organizationId },
        data: { scaleWalletBalanceCentavos: preview.walletAfterCentavos },
    })
    return preview
}

/** Close a Scale billing period: settle usage against wallet and roll expiresAt forward. */
export async function closeScaleBillingPeriodIfDue(
    organizationId: string,
    now = new Date(),
): Promise<boolean> {
    const subscription = await getActiveSubscriptionWithPlan(organizationId)
    if (subscription.plan.name !== PLAN_NAMES.scale) {
        return false
    }
    if (!subscription.expiresAt || subscription.expiresAt.getTime() > now.getTime()) {
        return false
    }

    const usagePhp = await scalePeriodUsagePhp(organizationId, subscription.expiresAt)
    const preview = await applyScaleSettlement(organizationId, usagePhp)

    let nextExpires = subscription.expiresAt
    while (nextExpires.getTime() <= now.getTime()) {
        nextExpires = proRenewsAt(nextExpires)
    }

    await prismaClient.subscription.update({
        where: { id: subscription.id },
        data: {
            status: preview.chargePhp > 0 ? "PAST_DUE" : "ACTIVE",
            expiresAt: nextExpires,
        },
    })

    return true
}
