import { randomUUID } from "node:crypto"
import env from "../../config/env.js"
import { AppError } from "../../platform/errors.js"
import prismaClient from "../../platform/prisma.js"
import type { Prisma } from "../../generated/prisma/client.js"
import {
    ensureBillingCatalog,
    getPlanByName,
    getProCheckoutAmountPhp,
    PLAN_NAMES,
} from "./catalog.js"
import {
    canReuseXenditCheckoutSession,
    createXenditSession,
    deactivateXenditRecurringPlan,
    findXenditCustomerByReference,
    getXenditSession,
    isDuplicateCustomerReferenceError,
    type XenditSessionResponse,
} from "./xendit/client.js"
import { activateProSubscription, renewProSubscription } from "./activate.js"
import { expireLapsedSubscriptions } from "./limits.js"
import { isEntitlementUnexpired, proRenewsAt } from "./period.js"
import { buildNestedCustomer, sessionCustomerFields } from "./sessionCustomer.js"

const BILLING_ADMIN_ROLES = new Set(["owner", "admin"])

/** Claim stored in Subscription.xenditSessionId while creating a Xendit session. */
const CHECKOUT_CLAIM_PREFIX = "claim:"
const CHECKOUT_CLAIM_TTL_MS = 60_000
const CHECKOUT_CLAIM_POLL_MS = 100

type CheckoutSessionResult = {
    componentsSdkKey: string
    sessionId: string
    expiresAt: string | null
}

type CheckoutClaimOutcome =
    | { kind: "reuse"; pendingId: string; sessionId: string }
    | { kind: "create"; pendingId: string; claim: string }
    | { kind: "wait" }

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

function sleep(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

function isCheckoutClaim(value: string | null | undefined): value is string {
    return typeof value === "string" && value.startsWith(CHECKOUT_CLAIM_PREFIX)
}

function parseCheckoutClaim(value: string): { token: string; expiresAtMs: number } | null {
    const rest = value.slice(CHECKOUT_CLAIM_PREFIX.length)
    const lastColon = rest.lastIndexOf(":")
    if (lastColon <= 0) return null
    const token = rest.slice(0, lastColon)
    const expiresAtMs = Number(rest.slice(lastColon + 1))
    if (!token || !Number.isFinite(expiresAtMs)) return null
    return { token, expiresAtMs }
}

function isFreshCheckoutClaim(value: string, now = Date.now()): boolean {
    const parsed = parseCheckoutClaim(value)
    return parsed !== null && parsed.expiresAtMs > now
}

function buildCheckoutClaim(token: string, now = Date.now()): string {
    return `${CHECKOUT_CLAIM_PREFIX}${token}:${now + CHECKOUT_CLAIM_TTL_MS}`
}

/**
 * Serialize Pro checkout across API processes with short Organization FOR UPDATE
 * transactions. The previous in-memory Map only queued work inside one Node process
 * and raced under multiple Render/API instances.
 */
async function lockOrganizationRow(tx: Prisma.TransactionClient, organizationId: string) {
    await tx.$queryRaw`SELECT id FROM "Organization" WHERE id = ${organizationId} FOR UPDATE`
}

async function assertNoUnexpiredActivePro(
    tx: Prisma.TransactionClient,
    organizationId: string,
    proPlanId: number,
) {
    const activePro = await tx.subscription.findFirst({
        where: {
            organizationId,
            planId: proPlanId,
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
}

async function findOrCreatePendingPro(
    tx: Prisma.TransactionClient,
    organizationId: string,
    proPlanId: number,
) {
    const existingPending = await tx.subscription.findFirst({
        where: {
            organizationId,
            planId: proPlanId,
            status: "PENDING",
        },
        orderBy: { createdAt: "desc" },
    })
    if (existingPending) {
        return existingPending
    }

    return tx.subscription.create({
        data: {
            organizationId,
            planId: proPlanId,
            status: "PENDING",
            startedAt: new Date(),
        },
    })
}

function outcomeFromPendingSession(
    pendingId: string,
    sessionId: string | null,
    claimToken: string,
): CheckoutClaimOutcome {
    if (!sessionId) {
        return { kind: "wait" }
    }
    if (!isCheckoutClaim(sessionId)) {
        return { kind: "reuse", pendingId, sessionId }
    }
    if (isFreshCheckoutClaim(sessionId)) {
        const parsed = parseCheckoutClaim(sessionId)
        if (parsed?.token === claimToken) {
            return { kind: "create", pendingId, claim: sessionId }
        }
        return { kind: "wait" }
    }
    return { kind: "wait" }
}

async function claimCheckoutSlot(
    organizationId: string,
    proPlanId: number,
    claimToken: string,
): Promise<CheckoutClaimOutcome> {
    return prismaClient.$transaction(async (tx) => {
        await lockOrganizationRow(tx, organizationId)
        await assertNoUnexpiredActivePro(tx, organizationId, proPlanId)

        const pending = await findOrCreatePendingPro(tx, organizationId, proPlanId)
        const sessionId = pending.xenditSessionId

        if (sessionId && !isCheckoutClaim(sessionId)) {
            return { kind: "reuse" as const, pendingId: pending.id, sessionId }
        }

        if (sessionId && isCheckoutClaim(sessionId) && isFreshCheckoutClaim(sessionId)) {
            const parsed = parseCheckoutClaim(sessionId)
            if (parsed?.token === claimToken) {
                return { kind: "create" as const, pendingId: pending.id, claim: sessionId }
            }
            return { kind: "wait" as const }
        }

        const claim = buildCheckoutClaim(claimToken)
        await tx.subscription.update({
            where: { id: pending.id },
            data: { xenditSessionId: claim },
        })
        return { kind: "create" as const, pendingId: pending.id, claim }
    })
}

async function claimAfterObservedSession(
    organizationId: string,
    proPlanId: number,
    pendingId: string,
    observedSessionId: string,
    claimToken: string,
): Promise<CheckoutClaimOutcome> {
    return prismaClient.$transaction(async (tx) => {
        await lockOrganizationRow(tx, organizationId)
        await assertNoUnexpiredActivePro(tx, organizationId, proPlanId)

        const pending = await tx.subscription.findUniqueOrThrow({
            where: { id: pendingId },
            select: { id: true, xenditSessionId: true },
        })

        if (pending.xenditSessionId !== observedSessionId) {
            return outcomeFromPendingSession(pending.id, pending.xenditSessionId, claimToken)
        }

        const claim = buildCheckoutClaim(claimToken)
        await tx.subscription.update({
            where: { id: pending.id },
            data: { xenditSessionId: claim },
        })
        return { kind: "create" as const, pendingId: pending.id, claim }
    })
}

async function clearCheckoutClaimIfOwned(
    organizationId: string,
    pendingId: string,
    claim: string,
) {
    await prismaClient.$transaction(async (tx) => {
        await lockOrganizationRow(tx, organizationId)
        const pending = await tx.subscription.findUnique({
            where: { id: pendingId },
            select: { xenditSessionId: true },
        })
        if (pending?.xenditSessionId !== claim) {
            return
        }
        await tx.subscription.update({
            where: { id: pendingId },
            data: { xenditSessionId: null },
        })
    })
}

async function persistCheckoutSessionIfClaimed(
    organizationId: string,
    pendingId: string,
    claim: string,
    session: XenditSessionResponse,
): Promise<
    | { kind: "stored" }
    | { kind: "reuse"; sessionId: string }
    | { kind: "lost" }
> {
    return prismaClient.$transaction(async (tx) => {
        await lockOrganizationRow(tx, organizationId)
        const pending = await tx.subscription.findUniqueOrThrow({
            where: { id: pendingId },
            select: { xenditSessionId: true },
        })

        if (pending.xenditSessionId === claim) {
            const recurringPlanId =
                session.subscription?.id ?? session.subscription?.plan_id ?? undefined
            await tx.subscription.update({
                where: { id: pendingId },
                data: {
                    xenditSessionId: session.payment_session_id,
                    ...(recurringPlanId ? { xenditRecurringPlanId: recurringPlanId } : {}),
                },
            })
            return { kind: "stored" as const }
        }

        if (pending.xenditSessionId && !isCheckoutClaim(pending.xenditSessionId)) {
            return { kind: "reuse" as const, sessionId: pending.xenditSessionId }
        }

        return { kind: "lost" as const }
    })
}

async function returnReusableXenditSession(
    organizationId: string,
    sessionId: string,
): Promise<CheckoutSessionResult | null> {
    const existing = await getXenditSession(sessionId)
    if (!canReuseXenditCheckoutSession(existing)) {
        return null
    }
    if (existing.customer_id) {
        await persistXenditCustomerId(organizationId, existing.customer_id)
    }
    return {
        componentsSdkKey: existing.components_sdk_key,
        sessionId: existing.payment_session_id,
        expiresAt: existing.expires_at ?? null,
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
    }): Promise<CheckoutSessionResult> {
        assertBillingEnabled()
        assertBillingRole(input.roleName)

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

        // Expire outside the org row lock — uses its own connection.
        await expireLapsedSubscriptions(input.organizationId)
        await ensureBillingCatalog()
        const proPlan = await getPlanByName(PLAN_NAMES.pro)
        const claimToken = randomUUID()
        const deadline = Date.now() + CHECKOUT_CLAIM_TTL_MS + 5_000

        while (Date.now() < deadline) {
            const outcome = await claimCheckoutSlot(
                input.organizationId,
                proPlan.id,
                claimToken,
            )

            if (outcome.kind === "wait") {
                await sleep(CHECKOUT_CLAIM_POLL_MS)
                continue
            }

            if (outcome.kind === "reuse") {
                const reused = await returnReusableXenditSession(
                    input.organizationId,
                    outcome.sessionId,
                )
                if (reused) {
                    return reused
                }

                const after = await claimAfterObservedSession(
                    input.organizationId,
                    proPlan.id,
                    outcome.pendingId,
                    outcome.sessionId,
                    claimToken,
                )
                if (after.kind === "wait") {
                    await sleep(CHECKOUT_CLAIM_POLL_MS)
                    continue
                }
                if (after.kind === "reuse") {
                    continue
                }
                return this.createXenditSessionForClaim(input, user, after.pendingId, after.claim)
            }

            return this.createXenditSessionForClaim(
                input,
                user,
                outcome.pendingId,
                outcome.claim,
            )
        }

        throw new AppError(
            503,
            "PAYMENT_PROVIDER_ERROR",
            "Checkout is busy for this organization; please try again",
        )
    }

    private async createXenditSessionForClaim(
        input: {
            organizationId: string
            userId: string
            returnUrl: string
        },
        user: {
            id: string
            email: string | null
            firstName: string | null
            lastName: string | null
        },
        pendingId: string,
        claim: string,
    ): Promise<CheckoutSessionResult> {
        const customerReference = await ensureXenditCustomerReference(input.organizationId)
        await resolveXenditCustomerId(input.organizationId, customerReference)
        const org = await loadOrgXenditCustomer(input.organizationId)
        const nestedCustomer = buildNestedCustomer(customerReference, user)
        const customerFields = sessionCustomerFields(org, nestedCustomer)

        const amount = getProCheckoutAmountPhp()
        const referenceId = `pro_${input.organizationId}_${Date.now()}`
        const createdAt = new Date()
        const sessionExpiresAt = new Date(createdAt.getTime() + 30 * 60 * 1000)
        // First month is charged by the session; Xendit requires anchor_date >= expires_at.
        const anchorDate = proRenewsAt(createdAt)

        const sessionBody: Record<string, unknown> = {
            reference_id: referenceId,
            session_type: "SUBSCRIPTION",
            mode: "COMPONENTS",
            amount: Number(amount),
            currency: "PHP",
            country: "PH",
            locale: "en",
            description: "AInvoker Pro (monthly)",
            expires_at: sessionExpiresAt.toISOString(),
            ...customerFields,
            metadata: {
                organizationId: input.organizationId,
                planName: PLAN_NAMES.pro,
                userId: input.userId,
                subscriptionId: pendingId,
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

        let session: XenditSessionResponse
        try {
            session = await createXenditSession(sessionBody)
        } catch (err) {
            if (!isDuplicateCustomerReferenceError(err)) {
                await clearCheckoutClaimIfOwned(input.organizationId, pendingId, claim)
                throw err
            }

            const customerId = await resolveXenditCustomerId(
                input.organizationId,
                customerReference,
            )
            if (!customerId) {
                await clearCheckoutClaimIfOwned(input.organizationId, pendingId, claim)
                throw err
            }

            const retryBody = { ...sessionBody }
            delete retryBody.customer
            try {
                session = await createXenditSession({
                    ...retryBody,
                    customer_id: customerId,
                })
            } catch (retryErr) {
                await clearCheckoutClaimIfOwned(input.organizationId, pendingId, claim)
                throw retryErr
            }
        }

        if (session.customer_id) {
            await persistXenditCustomerId(input.organizationId, session.customer_id)
        }

        const persisted = await persistCheckoutSessionIfClaimed(
            input.organizationId,
            pendingId,
            claim,
            session,
        )

        if (persisted.kind === "stored") {
            return {
                componentsSdkKey: session.components_sdk_key!,
                sessionId: session.payment_session_id,
                expiresAt: session.expires_at ?? null,
            }
        }

        if (persisted.kind === "reuse") {
            const reused = await returnReusableXenditSession(
                input.organizationId,
                persisted.sessionId,
            )
            if (reused) {
                return reused
            }
        }

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
