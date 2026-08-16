import { Prisma } from "../../generated/prisma/client.js"
import prismaClient from "../../platform/prisma.js"
import { ensureBillingCatalog, getPlanByName, PLAN_NAMES } from "./catalog.js"
import { proRenewsAt } from "./period.js"

export type ActivateProInput = {
    organizationId: string
    paymentReference: string
    paymentTokenId?: string
    amountPhp: number
    description?: string
    receiptUrl?: string | null
    xenditRecurringPlanId?: string
    paymentMethodType?: string
    paymentMethodBrand?: string
    paymentMethodLast4?: string
    /** Override next renewal date when Xendit provides one. */
    renewsAt?: Date
}

export async function activateProSubscription(input: ActivateProInput) {
    await ensureBillingCatalog()
    const proPlan = await getPlanByName(PLAN_NAMES.pro)

    const existingTx = await prismaClient.transaction.findUnique({
        where: { referenceNumber: input.paymentReference },
    })
    if (existingTx) {
        return { alreadyProcessed: true as const }
    }

    await prismaClient.$transaction(async (tx) => {
        const pending = await tx.subscription.findFirst({
            where: {
                organizationId: input.organizationId,
                planId: proPlan.id,
                status: "PENDING",
            },
            orderBy: { createdAt: "desc" },
        })

        if (!pending) {
            const activePro = await tx.subscription.findFirst({
                where: {
                    organizationId: input.organizationId,
                    planId: proPlan.id,
                    status: "ACTIVE",
                },
            })
            if (activePro) {
                return
            }
            // No pending or active Pro — ignore (stale webhook)
            return
        }

        await tx.subscription.updateMany({
            where: {
                organizationId: input.organizationId,
                status: "ACTIVE",
                id: { not: pending.id },
            },
            data: { status: "CANCELED" },
        })

        const startedAt = new Date()
        const expiresAt = input.renewsAt ?? proRenewsAt(startedAt)
        await tx.subscription.update({
            where: { id: pending.id },
            data: {
                status: "ACTIVE",
                startedAt,
                expiresAt,
                cancelAtPeriodEnd: false,
                canceledAt: null,
                ...(input.xenditRecurringPlanId
                    ? { xenditRecurringPlanId: input.xenditRecurringPlanId }
                    : {}),
            },
        })

        await tx.transaction.create({
            data: {
                subscriptionId: pending.id,
                amount: new Prisma.Decimal(input.amountPhp).div(100),
                paymentMethod: "xendit",
                referenceNumber: input.paymentReference,
                paymentStatus: "SUCCEEDED",
                description: input.description ?? "AInvoker Pro — first payment",
                receiptUrl: input.receiptUrl ?? null,
            },
        })

        const orgUpdate: {
            xenditPaymentTokenId?: string
            paymentMethodType?: string
            paymentMethodBrand?: string
            paymentMethodLast4?: string
        } = {}
        if (input.paymentTokenId) {
            orgUpdate.xenditPaymentTokenId = input.paymentTokenId
        }
        if (input.paymentMethodType) {
            orgUpdate.paymentMethodType = input.paymentMethodType
        }
        if (input.paymentMethodBrand) {
            orgUpdate.paymentMethodBrand = input.paymentMethodBrand
        }
        if (input.paymentMethodLast4) {
            orgUpdate.paymentMethodLast4 = input.paymentMethodLast4
        }
        if (Object.keys(orgUpdate).length > 0) {
            await tx.organization.update({
                where: { id: input.organizationId },
                data: orgUpdate,
            })
        }
    })

    return { activated: true as const }
}

/** Extend an active Pro subscription after a successful recurring cycle charge. */
export async function renewProSubscription(input: {
    organizationId: string
    paymentReference: string
    amountPhp: number
    description?: string
    receiptUrl?: string | null
    renewsAt?: Date
    xenditRecurringPlanId?: string
}) {
    await ensureBillingCatalog()
    const proPlan = await getPlanByName(PLAN_NAMES.pro)

    const existingTx = await prismaClient.transaction.findUnique({
        where: { referenceNumber: input.paymentReference },
    })
    if (existingTx) {
        return { alreadyProcessed: true as const }
    }

    await prismaClient.$transaction(async (tx) => {
        const active = await tx.subscription.findFirst({
            where: {
                organizationId: input.organizationId,
                planId: proPlan.id,
                status: { in: ["ACTIVE", "PAST_DUE"] },
            },
            orderBy: { startedAt: "desc" },
        })

        if (!active) {
            return
        }

        const base = active.expiresAt && active.expiresAt.getTime() > Date.now()
            ? active.expiresAt
            : new Date()
        const expiresAt = input.renewsAt ?? proRenewsAt(base)

        await tx.subscription.update({
            where: { id: active.id },
            data: {
                status: "ACTIVE",
                expiresAt,
                cancelAtPeriodEnd: false,
                canceledAt: null,
                ...(input.xenditRecurringPlanId
                    ? { xenditRecurringPlanId: input.xenditRecurringPlanId }
                    : {}),
            },
        })

        await tx.transaction.create({
            data: {
                subscriptionId: active.id,
                amount: new Prisma.Decimal(input.amountPhp).div(100),
                paymentMethod: "xendit",
                referenceNumber: input.paymentReference,
                paymentStatus: "SUCCEEDED",
                description: input.description ?? "AInvoker Pro — renewal",
                receiptUrl: input.receiptUrl ?? null,
            },
        })
    })

    return { renewed: true as const }
}
