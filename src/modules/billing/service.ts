import env from "../../config/env.js"
import { AppError } from "../../platform/errors.js"
import prismaClient from "../../platform/prisma.js"
import {
    ensureBillingCatalog,
    getPlanByName,
    getProCheckoutAmountPhp,
    PLAN_NAMES,
} from "./catalog.js"
import {
    createXenditSession,
    deactivateXenditRecurringPlan,
    findXenditCustomerByReference,
    getXenditSession,
    isDuplicateCustomerReferenceError,
} from "./xendit/client.js"
import { activateProSubscription, renewProSubscription } from "./activate.js"
import { expireLapsedSubscriptions } from "./limits.js"
import { isEntitlementUnexpired, proRenewsAt } from "./period.js"
import { buildNestedCustomer, sessionCustomerFields } from "./sessionCustomer.js"

const BILLING_ADMIN_ROLES = new Set(["owner", "admin"])

function assertBillingEnabled() {
    if (!env.BILLING_ENABLED) {
        throw new AppError(503, "BILLING_DISABLED", "Billing is not enabled")
    }
}

function assertBillingRole(roleName: string) {
    if (!BILLING_ADMIN_ROLES.has(roleName)) {
        throw new AppError(403, "FORBIDDEN", "Only organization owners or admins can manage billing")
    }
}

const checkoutLocks = new Map<string, Promise<unknown>>()

async function withOrgCheckoutLock<T>(organizationId: string, fn: () => Promise<T>): Promise<T> {
    const previous = checkoutLocks.get(organizationId) ?? Promise.resolve()
    let release: () => void = () => {}
    const current = new Promise<void>((resolve) => {
        release = resolve
    })
    const chain = previous.then(() => current)
    checkoutLocks.set(organizationId, chain)
    await previous
    try {
        return await fn()
    } finally {
        release()
        if (checkoutLocks.get(organizationId) === chain) {
            checkoutLocks.delete(organizationId)
        }
    }
}

async function loadOrgXenditCustomer(organizationId: string) {
    return prismaClient.organization.findUniqueOrThrow({
        where: { id: organizationId },
        select: {
            id: true,
            xenditCustomerReference: true,
            xenditCustomerId: true,
            xenditPaymentTokenId: true,
            paymentMethodType: true,
            paymentMethodBrand: true,
            paymentMethodLast4: true,
        },
    })
}

async function ensureXenditCustomerReference(organizationId: string) {
    const org = await loadOrgXenditCustomer(organizationId)

    if (org.xenditCustomerReference) {
        return org.xenditCustomerReference
    }

    const reference = `org_${organizationId}`
    await prismaClient.organization.update({
        where: { id: organizationId },
        data: { xenditCustomerReference: reference },
    })
    return reference
}

async function persistXenditCustomerId(organizationId: string, customerId: string) {
    await prismaClient.organization.update({
        where: { id: organizationId },
        data: { xenditCustomerId: customerId },
    })
}

async function resolveXenditCustomerId(organizationId: string, referenceId: string) {
    const org = await loadOrgXenditCustomer(organizationId)
    if (org.xenditCustomerId) {
        return org.xenditCustomerId
    }

    const existing = await findXenditCustomerByReference(referenceId)
    if (!existing?.id) {
        return null
    }

    await persistXenditCustomerId(organizationId, existing.id)
    return existing.id
}

async function ensurePendingProSubscription(organizationId: string) {
    await ensureBillingCatalog()
    const proPlan = await getPlanByName(PLAN_NAMES.pro)

    const existingPending = await prismaClient.subscription.findFirst({
        where: {
            organizationId,
            planId: proPlan.id,
            status: "PENDING",
        },
        orderBy: { createdAt: "desc" },
    })
    if (existingPending) {
        return existingPending
    }

    return prismaClient.subscription.create({
        data: {
            organizationId,
            planId: proPlan.id,
            status: "PENDING",
            startedAt: new Date(),
        },
    })
}

function paymentMethodSnapshot(org: {
    xenditPaymentTokenId: string | null
    paymentMethodType: string | null
    paymentMethodBrand: string | null
    paymentMethodLast4: string | null
}) {
    if (
        !org.xenditPaymentTokenId &&
        !org.paymentMethodType &&
        !org.paymentMethodBrand &&
        !org.paymentMethodLast4
    ) {
        return null
    }
    return {
        type: org.paymentMethodType,
        brand: org.paymentMethodBrand,
        last4: org.paymentMethodLast4,
        hasToken: Boolean(org.xenditPaymentTokenId),
    }
}

function mapInvoiceStatus(status: string): "issued" | "paid" | "failed" | "refunded" {
    switch (status) {
        case "SUCCEEDED":
            return "paid"
        case "FAILED":
            return "failed"
        case "REFUNDED":
            return "refunded"
        default:
            return "issued"
    }
}

function extractMetadata(data: Record<string, unknown>) {
    const metadata = data.metadata as Record<string, string> | undefined
    if (metadata?.organizationId) {
        return metadata
    }

    const nested = data.payment_session as Record<string, unknown> | undefined
    if (nested?.metadata) {
        return nested.metadata as Record<string, string>
    }

    const plan = data.plan as Record<string, unknown> | undefined
    if (plan?.metadata) {
        return plan.metadata as Record<string, string>
    }

    return undefined
}

function extractReceiptUrl(data: Record<string, unknown>): string | null {
    const candidates = [
        data.receipt_url,
        data.invoice_url,
        data.payment_url,
        (data.payment as Record<string, unknown> | undefined)?.receipt_url,
        (data.payment as Record<string, unknown> | undefined)?.invoice_url,
    ]
    for (const value of candidates) {
        if (typeof value === "string" && value.length > 0) {
            return value
        }
    }
    return null
}

function extractPaymentMethodSnapshot(data: Record<string, unknown>): {
    paymentTokenId?: string
    paymentMethodType?: string
    paymentMethodBrand?: string
    paymentMethodLast4?: string
} {
    const paymentTokenId =
        (data.payment_token_id as string | undefined) ??
        (data.token_id as string | undefined) ??
        ((data.payment_token as Record<string, unknown> | undefined)?.id as string | undefined)

    const channel =
        (data.channel_code as string | undefined) ??
        (data.payment_method as string | undefined) ??
        ((data.payment_method as Record<string, unknown> | undefined)?.type as string | undefined)

    const card =
        (data.card as Record<string, unknown> | undefined) ??
        ((data.payment_method as Record<string, unknown> | undefined)?.card as
            | Record<string, unknown>
            | undefined)

    const brand =
        (card?.network as string | undefined) ??
        (card?.brand as string | undefined) ??
        (data.card_brand as string | undefined)

    const last4 =
        (card?.last_four as string | undefined) ??
        (card?.last4 as string | undefined) ??
        (data.last_four as string | undefined) ??
        (data.last4 as string | undefined)

    return {
        ...(paymentTokenId ? { paymentTokenId } : {}),
        ...(channel ? { paymentMethodType: String(channel) } : {}),
        ...(brand ? { paymentMethodBrand: String(brand) } : {}),
        ...(last4 ? { paymentMethodLast4: String(last4) } : {}),
    }
}

function extractRecurringPlanId(data: Record<string, unknown>): string | undefined {
    return (
        (data.plan_id as string | undefined) ??
        (data.id as string | undefined) ??
        ((data.plan as Record<string, unknown> | undefined)?.id as string | undefined) ??
        ((data.subscription as Record<string, unknown> | undefined)?.id as string | undefined) ??
        ((data.subscription as Record<string, unknown> | undefined)?.plan_id as string | undefined)
    )
}

class BillingService {
    async getOrganizationSubscription(organizationId: string) {
        await ensureBillingCatalog()
        await expireLapsedSubscriptions(organizationId)

        const subscriptions = await prismaClient.subscription.findMany({
            where: {
                organizationId,
                status: { in: ["PENDING", "ACTIVE", "PAST_DUE", "EXPIRED"] },
            },
            include: { plan: true },
            orderBy: { startedAt: "desc" },
        })

        const unexpiredActive = subscriptions.find(
            (s) =>
                (s.status === "ACTIVE" || s.status === "PAST_DUE") &&
                isEntitlementUnexpired(s.expiresAt),
        )
        const pending = subscriptions.find((s) => s.status === "PENDING")
        const expired = subscriptions.find((s) => s.status === "EXPIRED")
        const subscription = unexpiredActive ?? pending ?? expired ?? subscriptions[0]

        const pendingPro = subscriptions.find(
            (s) => s.status === "PENDING" && s.plan.name === PLAN_NAMES.pro,
        )

        if (!subscription) {
            throw new AppError(404, "NOT_FOUND", "No subscription found for this organization")
        }

        const org = await loadOrgXenditCustomer(organizationId)

        return {
            planName: subscription.plan.name,
            status: subscription.status,
            billingMode: subscription.plan.billingMode,
            tokenLimit: subscription.plan.tokenLimit,
            requestLimit: subscription.plan.requestLimit,
            pendingPlanName: pendingPro ? pendingPro.plan.name : null,
            expiresAt: subscription.expiresAt ? subscription.expiresAt.toISOString() : null,
            renewsAt: subscription.expiresAt ? subscription.expiresAt.toISOString() : null,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            canceledAt: subscription.canceledAt ? subscription.canceledAt.toISOString() : null,
            paymentMethod: paymentMethodSnapshot(org),
        }
    }

    async listOrganizationInvoices(organizationId: string, roleName: string) {
        assertBillingRole(roleName)

        const rows = await prismaClient.transaction.findMany({
            where: {
                subscription: { organizationId },
            },
            orderBy: { createdAt: "desc" },
            take: 100,
            include: {
                subscription: {
                    include: { plan: true },
                },
            },
        })

        return rows.map((row) => ({
            id: row.id,
            date: row.createdAt.toISOString(),
            description:
                row.description ??
                `AInvoker ${row.subscription.plan.name} — ${row.createdAt.toLocaleString("en-US", {
                    month: "long",
                    year: "numeric",
                    timeZone: "UTC",
                })}`,
            status: mapInvoiceStatus(row.paymentStatus),
            amount: row.amount.toString(),
            currency: "PHP",
            receiptUrl: row.receiptUrl,
            referenceNumber: row.referenceNumber,
        }))
    }

    async cancelOrganizationSubscription(input: {
        organizationId: string
        roleName: string
    }) {
        assertBillingEnabled()
        assertBillingRole(input.roleName)
        await expireLapsedSubscriptions(input.organizationId)

        const proPlan = await getPlanByName(PLAN_NAMES.pro)
        const active = await prismaClient.subscription.findFirst({
            where: {
                organizationId: input.organizationId,
                planId: proPlan.id,
                status: { in: ["ACTIVE", "PAST_DUE"] },
            },
            orderBy: { startedAt: "desc" },
        })

        if (!active || !isEntitlementUnexpired(active.expiresAt)) {
            throw new AppError(409, "NO_ACTIVE_PAID_PLAN", "No active paid subscription to cancel")
        }

        if (active.cancelAtPeriodEnd) {
            return {
                cancelAtPeriodEnd: true,
                expiresAt: active.expiresAt ? active.expiresAt.toISOString() : null,
                alreadyCanceled: true as const,
            }
        }

        if (active.xenditRecurringPlanId) {
            try {
                await deactivateXenditRecurringPlan(active.xenditRecurringPlanId)
            } catch (err) {
                // If Xendit already deactivated, continue marking locally.
                if (!(err instanceof AppError && err.status === 404)) {
                    throw err
                }
            }
        }

        const updated = await prismaClient.subscription.update({
            where: { id: active.id },
            data: {
                cancelAtPeriodEnd: true,
                canceledAt: new Date(),
            },
        })

        return {
            cancelAtPeriodEnd: true,
            expiresAt: updated.expiresAt ? updated.expiresAt.toISOString() : null,
            alreadyCanceled: false as const,
        }
    }

    async createProCheckoutSession(input: {
        organizationId: string
        userId: string
        roleName: string
        returnUrl: string
    }) {
        assertBillingEnabled()
        assertBillingRole(input.roleName)

        return withOrgCheckoutLock(input.organizationId, () =>
            this.createProCheckoutSessionLocked(input),
        )
    }

    private async createProCheckoutSessionLocked(input: {
        organizationId: string
        userId: string
        roleName: string
        returnUrl: string
    }) {
        const user = await prismaClient.user.findUnique({
            where: { id: input.userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
            },
        })
        if (!user) {
            throw new AppError(404, "NOT_FOUND", "User not found")
        }

        await expireLapsedSubscriptions(input.organizationId)
        const proPlan = await getPlanByName(PLAN_NAMES.pro)
        const activePro = await prismaClient.subscription.findFirst({
            where: {
                organizationId: input.organizationId,
                planId: proPlan.id,
                status: "ACTIVE",
            },
            orderBy: { startedAt: "desc" },
        })
        if (activePro && isEntitlementUnexpired(activePro.expiresAt)) {
            throw new AppError(
                409,
                "ALREADY_ACTIVE",
                "Pro is already active for this organization",
            )
        }

        const pendingSub = await ensurePendingProSubscription(input.organizationId)

        if (pendingSub.xenditSessionId) {
            const existing = await getXenditSession(pendingSub.xenditSessionId)
            if (existing?.status === "ACTIVE" && existing.components_sdk_key) {
                if (existing.customer_id) {
                    await persistXenditCustomerId(input.organizationId, existing.customer_id)
                }
                return {
                    componentsSdkKey: existing.components_sdk_key,
                    sessionId: existing.payment_session_id,
                    expiresAt: existing.expires_at ?? null,
                }
            }
        }

        const customerReference = await ensureXenditCustomerReference(input.organizationId)
        await resolveXenditCustomerId(input.organizationId, customerReference)
        const org = await loadOrgXenditCustomer(input.organizationId)
        const nestedCustomer = buildNestedCustomer(customerReference, user)
        const customerFields = sessionCustomerFields(org, nestedCustomer)

        const amount = getProCheckoutAmountPhp()
        const referenceId = `pro_${input.organizationId}_${Date.now()}`
        const anchorDate = new Date()
        // Xendit max day-of-month for anchors is 28
        if (anchorDate.getUTCDate() > 28) {
            anchorDate.setUTCDate(28)
        }

        const sessionBody: Record<string, unknown> = {
            reference_id: referenceId,
            session_type: "SUBSCRIPTION",
            mode: "COMPONENTS",
            amount: Number(amount),
            currency: "PHP",
            country: "PH",
            locale: "en",
            description: "AInvoker Pro (monthly)",
            ...customerFields,
            metadata: {
                organizationId: input.organizationId,
                planName: PLAN_NAMES.pro,
                userId: input.userId,
                subscriptionId: pendingSub.id,
            },
            subscription: {
                schedule: {
                    interval: "MONTH",
                    interval_count: 1,
                    anchor_date: anchorDate.toISOString(),
                    retry_interval: "DAY",
                    retry_interval_count: 1,
                    total_retry: 3,
                    failed_attempt_notifications: [1, 2, 3],
                },
                failed_cycle_action: "RESUME",
            },
            components_configuration: {
                origins: env.getXenditComponentsOrigins(),
                return_url: input.returnUrl,
            },
        }

        let session
        try {
            session = await createXenditSession(sessionBody)
        } catch (err) {
            if (!isDuplicateCustomerReferenceError(err)) {
                throw err
            }

            const customerId = await resolveXenditCustomerId(input.organizationId, customerReference)
            if (!customerId) {
                throw err
            }

            const retryBody = { ...sessionBody }
            delete retryBody.customer
            session = await createXenditSession({
                ...retryBody,
                customer_id: customerId,
            })
        }

        if (session.customer_id) {
            await persistXenditCustomerId(input.organizationId, session.customer_id)
        }

        const recurringPlanId =
            session.subscription?.id ?? session.subscription?.plan_id ?? undefined

        await prismaClient.subscription.update({
            where: { id: pendingSub.id },
            data: {
                xenditSessionId: session.payment_session_id,
                ...(recurringPlanId ? { xenditRecurringPlanId: recurringPlanId } : {}),
            },
        })

        return {
            componentsSdkKey: session.components_sdk_key!,
            sessionId: session.payment_session_id,
            expiresAt: session.expires_at ?? null,
        }
    }

    async handleXenditWebhook(payload: unknown, callbackToken: string | undefined) {
        if (!env.BILLING_ENABLED) {
            return { handled: false }
        }

        if (!env.XENDIT_WEBHOOK_TOKEN || callbackToken !== env.XENDIT_WEBHOOK_TOKEN) {
            throw new AppError(401, "UNAUTHORIZED", "Invalid webhook token")
        }

        const event = payload as {
            event?: string
            data?: Record<string, unknown>
        }

        const eventName = event.event ?? ""
        const data = event.data ?? (payload as Record<string, unknown>)
        const metadata = extractMetadata(data)
        const amountPhp = getProCheckoutAmountPhp()
        const receiptUrl = extractReceiptUrl(data)
        const pm = extractPaymentMethodSnapshot(data)
        const recurringPlanId = extractRecurringPlanId(data)

        if (
            eventName === "payment_session.completed" ||
            eventName === "payment.capture" ||
            eventName === "payment.succeeded" ||
            eventName === "payment_token.activation"
        ) {
            if (!metadata?.organizationId || metadata.planName !== PLAN_NAMES.pro) {
                // Token activation may still update payment method on known org via plan id
                if (eventName === "payment_token.activation" && recurringPlanId) {
                    await this.persistPaymentMethodByPlanId(recurringPlanId, pm)
                }
                return { handled: true, skipped: true }
            }

            const paymentId =
                (data.payment_id as string | undefined) ??
                (data.id as string | undefined) ??
                (data.payment_session_id as string | undefined) ??
                `xendit_${Date.now()}`

            await activateProSubscription({
                organizationId: metadata.organizationId,
                paymentReference: paymentId,
                amountPhp,
                receiptUrl,
                description: "AInvoker Pro — first payment",
                ...(pm.paymentTokenId ? { paymentTokenId: pm.paymentTokenId } : {}),
                ...(pm.paymentMethodType ? { paymentMethodType: pm.paymentMethodType } : {}),
                ...(pm.paymentMethodBrand ? { paymentMethodBrand: pm.paymentMethodBrand } : {}),
                ...(pm.paymentMethodLast4 ? { paymentMethodLast4: pm.paymentMethodLast4 } : {}),
                ...(recurringPlanId ? { xenditRecurringPlanId: recurringPlanId } : {}),
            })

            return { handled: true, activated: true }
        }

        if (
            eventName === "recurring.cycle.succeeded" ||
            eventName === "subscription.cycle.succeeded"
        ) {
            const organizationId =
                metadata?.organizationId ??
                (await this.resolveOrgIdFromRecurringPlan(recurringPlanId))
            if (!organizationId) {
                return { handled: true, skipped: true }
            }

            const paymentId =
                (data.payment_id as string | undefined) ??
                (data.id as string | undefined) ??
                `cycle_${Date.now()}`

            const next =
                typeof data.next_scheduled_timestamp === "string"
                    ? new Date(data.next_scheduled_timestamp)
                    : undefined

            await renewProSubscription({
                organizationId,
                paymentReference: paymentId,
                amountPhp,
                receiptUrl,
                description: "AInvoker Pro — renewal",
                renewsAt: next && !Number.isNaN(next.getTime()) ? next : proRenewsAt(),
                ...(recurringPlanId ? { xenditRecurringPlanId: recurringPlanId } : {}),
            })

            return { handled: true, renewed: true }
        }

        if (
            eventName === "recurring.cycle.failed" ||
            eventName === "subscription.cycle.failed"
        ) {
            const organizationId =
                metadata?.organizationId ??
                (await this.resolveOrgIdFromRecurringPlan(recurringPlanId))
            if (!organizationId) {
                return { handled: true, skipped: true }
            }

            const proPlan = await getPlanByName(PLAN_NAMES.pro)
            await prismaClient.subscription.updateMany({
                where: {
                    organizationId,
                    planId: proPlan.id,
                    status: "ACTIVE",
                },
                data: { status: "PAST_DUE" },
            })
            return { handled: true, pastDue: true }
        }

        if (
            eventName === "recurring.plan.inactive" ||
            eventName === "recurring.plan.deactivated" ||
            eventName === "subscription.plan.deactivated"
        ) {
            if (recurringPlanId) {
                await prismaClient.subscription.updateMany({
                    where: { xenditRecurringPlanId: recurringPlanId },
                    data: {
                        cancelAtPeriodEnd: true,
                        canceledAt: new Date(),
                    },
                })
            }
            return { handled: true, canceledAtPeriodEnd: true }
        }

        return { handled: true, ignored: eventName }
    }

    private async resolveOrgIdFromRecurringPlan(planId: string | undefined) {
        if (!planId) return null
        const sub = await prismaClient.subscription.findFirst({
            where: { xenditRecurringPlanId: planId },
            select: { organizationId: true },
        })
        return sub?.organizationId ?? null
    }

    private async persistPaymentMethodByPlanId(
        planId: string,
        pm: {
            paymentTokenId?: string
            paymentMethodType?: string
            paymentMethodBrand?: string
            paymentMethodLast4?: string
        },
    ) {
        const sub = await prismaClient.subscription.findFirst({
            where: { xenditRecurringPlanId: planId },
            select: { organizationId: true },
        })
        if (!sub) return

        const data: {
            xenditPaymentTokenId?: string
            paymentMethodType?: string
            paymentMethodBrand?: string
            paymentMethodLast4?: string
        } = {}
        if (pm.paymentTokenId) data.xenditPaymentTokenId = pm.paymentTokenId
        if (pm.paymentMethodType) data.paymentMethodType = pm.paymentMethodType
        if (pm.paymentMethodBrand) data.paymentMethodBrand = pm.paymentMethodBrand
        if (pm.paymentMethodLast4) data.paymentMethodLast4 = pm.paymentMethodLast4
        if (Object.keys(data).length === 0) return

        await prismaClient.organization.update({
            where: { id: sub.organizationId },
            data,
        })
    }
}

export default new BillingService()
