import type { Prisma } from "../../generated/prisma/client.js"
import prismaClient from "../../platform/prisma.js"
import { getPlanByName, getProCheckoutAmountPhp, getScaleCheckoutAmountPhp, PLAN_NAMES } from "./catalog.js"
import { quotaPeriodForSubscription } from "./period.js"

type DbClient = Prisma.TransactionClient | typeof prismaClient

/** Entitled Pro subscription for an org, or null when none is active and unexpired. */
export async function findEntitledProSubscription(
    db: DbClient,
    organizationId: string,
    now = new Date(),
) {
    const proPlan = await getPlanByName(PLAN_NAMES.pro)
    const pro = await db.subscription.findFirst({
        where: {
            organizationId,
            planId: proPlan.id,
            status: { in: ["ACTIVE", "PAST_DUE"] },
        },
        orderBy: { startedAt: "desc" },
    })
    if (!pro || !quotaPeriodForSubscription(pro, now)) return null
    return pro
}

/** Unused share of the current Pro period, in PHP centavos. Zero without an entitled Pro. */
export function proProrationCreditCentavos(
    subscription: { status: string; startedAt: Date; expiresAt: Date | null },
    now = new Date(),
): number {
    const period = quotaPeriodForSubscription(subscription, now)
    if (!period) return 0
    const periodMs = period.periodEnd.getTime() - period.periodStart.getTime()
    const remainingMs = Math.max(0, period.periodEnd.getTime() - now.getTime())
    if (periodMs <= 0) return 0
    return Math.floor(getProCheckoutAmountPhp() * Math.min(1, remainingMs / periodMs))
}

export async function computeProProrationCreditCentavos(
    organizationId: string,
    now = new Date(),
    db: DbClient = prismaClient,
): Promise<number> {
    const pro = await findEntitledProSubscription(db, organizationId, now)
    return pro ? proProrationCreditCentavos(pro, now) : 0
}

export type ScaleUpgradePreview = {
    hasActivePro: boolean
    proCreditPhp: number
    advancePhp: number
    totalWalletCreditPhp: number
}

export async function previewScaleUpgrade(
    organizationId: string,
    now = new Date(),
): Promise<ScaleUpgradePreview> {
    const pro = await findEntitledProSubscription(prismaClient, organizationId, now)
    const proCredit = pro ? proProrationCreditCentavos(pro, now) : 0
    const advance = getScaleCheckoutAmountPhp()
    return {
        hasActivePro: Boolean(pro),
        proCreditPhp: proCredit / 100,
        advancePhp: advance / 100,
        totalWalletCreditPhp: (advance + proCredit) / 100,
    }
}
