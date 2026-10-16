import type { Prisma } from "../../generated/prisma/client.js"
import prismaClient from "../../platform/prisma.js"
import { AppError } from "../../platform/errors.js"
import { AUDIT_ACTIONS } from "../audit/actions.js"
import { recordAuditEvent } from "../audit/record.js"
import {
    ensureBillingCatalog,
    getPlanByName,
    getScaleCheckoutAmountPhp,
    PLAN_NAMES,
} from "./catalog.js"
import { proRenewsAt } from "./period.js"
import { deactivateXenditRecurringPlan } from "./xendit/client.js"
import type {
    ListAdminSubscriptionsQuery,
    ListAdminTransactionsQuery,
    UpdateAdminSubscriptionInput,
} from "./adminSchemas.js"

type SubscriptionWithRelations = Prisma.SubscriptionGetPayload<{
    include: {
        organization: { select: { id: true; name: true; slug: true } }
        plan: { select: { name: true } }
    }
}>

function serializeSubscription(sub: SubscriptionWithRelations) {
    return {
        id: sub.id,
        organization: {
            id: sub.organization.id,
            name: sub.organization.name,
            slug: sub.organization.slug,
        },
        planName: sub.plan.name,
        status: sub.status,
        startedAt: sub.startedAt.toISOString(),
        expiresAt: sub.expiresAt ? sub.expiresAt.toISOString() : null,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
        xenditRecurringPlanId: sub.xenditRecurringPlanId,
        updatedAt: sub.updatedAt.toISOString(),
    }
}

class AdminBillingService {
    async listPlans() {
        await ensureBillingCatalog()
        const plans = await prismaClient.plan.findMany({
            orderBy: { id: "asc" },
        })
        // Catalog `monthlyPrice` is the advertised PHP list price (Pro = ₱499).
        // Scale has no fixed monthly fee — show the wallet advance from checkout config.
        const scaleAdvancePhp = (getScaleCheckoutAmountPhp() / 100).toFixed(2)

        return plans.map((plan) => {
            let monthlyPrice = plan.monthlyPrice.toString()
            let priceNote: string | null = null

            if (plan.name === PLAN_NAMES.pro) {
                priceNote = "per month"
            } else if (plan.name === PLAN_NAMES.scale) {
                monthlyPrice = scaleAdvancePhp
                priceNote = "wallet advance"
            } else if (plan.name === PLAN_NAMES.free) {
                monthlyPrice = "0"
                priceNote = null
            }

            return {
                id: plan.id,
                name: plan.name,
                monthlyPrice,
                priceNote,
                tokenLimit: plan.tokenLimit,
                requestLimit: plan.requestLimit,
                billingMode: plan.billingMode,
                description: plan.description,
            }
        })
    }

    private subscriptionWhere(query: ListAdminSubscriptionsQuery): Prisma.SubscriptionWhereInput {
        const where: Prisma.SubscriptionWhereInput = {}

        if (query.status) {
            where.status = query.status
        }
        if (query.plan) {
            where.plan = { name: query.plan }
        }

        const q = query.q?.trim()
        if (q) {
            where.OR = [
                { id: q },
                { organizationId: q },
                {
                    organization: {
                        OR: [
                            { id: q },
                            { name: { contains: q, mode: "insensitive" } },
                            { slug: { contains: q, mode: "insensitive" } },
                        ],
                    },
                },
            ]
        }

        return where
    }

    async listSubscriptions(query: ListAdminSubscriptionsQuery) {
        const where = this.subscriptionWhere(query)

        const [total, rows] = await Promise.all([
            prismaClient.subscription.count({ where }),
            prismaClient.subscription.findMany({
                where,
                orderBy: { updatedAt: "desc" },
                take: query.limit,
                skip: query.offset,
                include: {
                    organization: { select: { id: true, name: true, slug: true } },
                    plan: { select: { name: true } },
                },
            }),
        ])

        return {
            items: rows.map(serializeSubscription),
            total,
            limit: query.limit,
            offset: query.offset,
        }
    }

    private transactionWhere(query: ListAdminTransactionsQuery): Prisma.TransactionWhereInput {
        const where: Prisma.TransactionWhereInput = {}

        if (query.paymentStatus) {
            where.paymentStatus = query.paymentStatus
        }

        if (query.from || query.to) {
            where.createdAt = {}
            if (query.from) where.createdAt.gte = new Date(query.from)
            if (query.to) where.createdAt.lte = new Date(query.to)
        }

        const q = query.q?.trim()
        if (q) {
            where.OR = [
                { id: q },
                { referenceNumber: { contains: q, mode: "insensitive" } },
                {
                    subscription: {
                        organization: {
                            OR: [
                                { id: q },
                                { name: { contains: q, mode: "insensitive" } },
                                { slug: { contains: q, mode: "insensitive" } },
                            ],
                        },
                    },
                },
            ]
        }

        return where
    }

    async listTransactions(query: ListAdminTransactionsQuery) {
        const where = this.transactionWhere(query)

        const [total, rows] = await Promise.all([
            prismaClient.transaction.count({ where }),
            prismaClient.transaction.findMany({
                where,
                orderBy: { createdAt: "desc" },
                take: query.limit,
                skip: query.offset,
                include: {
                    subscription: {
                        include: {
                            organization: { select: { id: true, name: true, slug: true } },
                            plan: { select: { name: true } },
                        },
                    },
                },
            }),
        ])

        return {
            items: rows.map((row) => ({
                id: row.id,
                amount: row.amount.toString(),
                paymentMethod: row.paymentMethod,
                referenceNumber: row.referenceNumber,
                paymentStatus: row.paymentStatus,
                description: row.description,
                receiptUrl: row.receiptUrl,
                createdAt: row.createdAt.toISOString(),
                organization: {
                    id: row.subscription.organization.id,
                    name: row.subscription.organization.name,
                    slug: row.subscription.organization.slug,
                },
                planName: row.subscription.plan.name,
                subscriptionId: row.subscriptionId,
            })),
            total,
            limit: query.limit,
            offset: query.offset,
        }
    }

    private async loadSubscription(subscriptionId: string) {
        const sub = await prismaClient.subscription.findUnique({
            where: { id: subscriptionId },
            include: {
                organization: { select: { id: true, name: true, slug: true } },
                plan: { select: { name: true } },
            },
        })
        if (!sub) {
            throw new AppError(404, "NOT_FOUND", "Subscription not found")
        }
        return sub
    }

    async updateSubscription(
        subscriptionId: string,
        input: UpdateAdminSubscriptionInput,
        actorUserId: string,
    ) {
        if (input.action === "cancel") {
            return this.cancelSubscription(subscriptionId, input.atPeriodEnd, actorUserId)
        }
        if (input.action === "grant_pro") {
            return this.grantPro(subscriptionId, input.expiresAt, actorUserId)
        }
        return this.extendPro(subscriptionId, input.days, actorUserId)
    }

    private async cancelSubscription(
        subscriptionId: string,
        atPeriodEnd: boolean,
        actorUserId: string,
    ) {
        const sub = await this.loadSubscription(subscriptionId)

        if (sub.status === "CANCELED" || sub.status === "EXPIRED") {
            throw new AppError(409, "ALREADY_CANCELED", "Subscription is already canceled or expired")
        }

        if (sub.xenditRecurringPlanId) {
            try {
                await deactivateXenditRecurringPlan(sub.xenditRecurringPlanId)
            } catch (err) {
                if (!(err instanceof AppError && err.status === 404)) {
                    throw err
                }
            }
        }

        const now = new Date()
        const updated = await prismaClient.subscription.update({
            where: { id: subscriptionId },
            data: atPeriodEnd
                ? {
                      cancelAtPeriodEnd: true,
                      canceledAt: now,
                  }
                : {
                      status: "CANCELED",
                      cancelAtPeriodEnd: false,
                      canceledAt: now,
                      expiresAt: now,
                  },
            include: {
                organization: { select: { id: true, name: true, slug: true } },
                plan: { select: { name: true } },
            },
        })

        await recordAuditEvent({
            actorUserId,
            actorType: "PLATFORM_ADMIN",
            action: AUDIT_ACTIONS.subscriptionCancel,
            targetType: "subscription",
            targetId: subscriptionId,
            organizationId: updated.organization.id,
            summary: `Canceled ${updated.plan.name} for "${updated.organization.name}"${atPeriodEnd ? " (at period end)" : ""}`,
            metadata: { atPeriodEnd, planName: updated.plan.name },
        })

        return serializeSubscription(updated)
    }

    private async grantPro(
        subscriptionId: string,
        expiresAtIso: string | undefined,
        actorUserId: string,
    ) {
        await ensureBillingCatalog()
        const sub = await this.loadSubscription(subscriptionId)
        const proPlan = await getPlanByName(PLAN_NAMES.pro)
        const now = new Date()
        const expiresAt = expiresAtIso ? new Date(expiresAtIso) : proRenewsAt(now)

        if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= now.getTime()) {
            throw new AppError(400, "VALIDATION_ERROR", "expiresAt must be a future date")
        }

        const updated = await prismaClient.$transaction(async (tx) => {
            await tx.subscription.updateMany({
                where: {
                    organizationId: sub.organizationId,
                    status: { in: ["ACTIVE", "PAST_DUE"] },
                    id: { not: subscriptionId },
                },
                data: {
                    status: "CANCELED",
                    cancelAtPeriodEnd: false,
                    canceledAt: now,
                },
            })

            return tx.subscription.update({
                where: { id: subscriptionId },
                data: {
                    planId: proPlan.id,
                    status: "ACTIVE",
                    startedAt: now,
                    expiresAt,
                    cancelAtPeriodEnd: false,
                    canceledAt: null,
                    xenditRecurringPlanId: null,
                    xenditSessionId: null,
                },
                include: {
                    organization: { select: { id: true, name: true, slug: true } },
                    plan: { select: { name: true } },
                },
            })
        })

        await recordAuditEvent({
            actorUserId,
            actorType: "PLATFORM_ADMIN",
            action: AUDIT_ACTIONS.subscriptionGrantPro,
            targetType: "subscription",
            targetId: subscriptionId,
            organizationId: updated.organization.id,
            summary: `Granted Pro to "${updated.organization.name}"`,
            metadata: { expiresAt: expiresAt.toISOString() },
        })

        return serializeSubscription(updated)
    }

    private async extendPro(subscriptionId: string, days: number, actorUserId: string) {
        const sub = await this.loadSubscription(subscriptionId)

        if (sub.plan.name !== PLAN_NAMES.pro) {
            throw new AppError(409, "NOT_PRO", "Only Pro subscriptions can be extended")
        }
        if (sub.status !== "ACTIVE" && sub.status !== "PAST_DUE") {
            throw new AppError(409, "NOT_ACTIVE", "Subscription must be ACTIVE or PAST_DUE to extend")
        }

        const now = new Date()
        const base =
            sub.expiresAt && sub.expiresAt.getTime() > now.getTime() ? sub.expiresAt : now
        const expiresAt = new Date(base.getTime() + days * 24 * 60 * 60 * 1000)

        const updated = await prismaClient.subscription.update({
            where: { id: subscriptionId },
            data: {
                expiresAt,
                cancelAtPeriodEnd: false,
                canceledAt: null,
                status: "ACTIVE",
            },
            include: {
                organization: { select: { id: true, name: true, slug: true } },
                plan: { select: { name: true } },
            },
        })

        await recordAuditEvent({
            actorUserId,
            actorType: "PLATFORM_ADMIN",
            action: AUDIT_ACTIONS.subscriptionExtendPro,
            targetType: "subscription",
            targetId: subscriptionId,
            organizationId: updated.organization.id,
            summary: `Extended Pro for "${updated.organization.name}" by ${days} day(s)`,
            metadata: {
                days,
                expiresAt: expiresAt.toISOString(),
            },
        })

        return serializeSubscription(updated)
    }
}

export default new AdminBillingService()
