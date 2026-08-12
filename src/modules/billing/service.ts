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
    findXenditCustomerByReference,
    getXenditSession,
    isDuplicateCustomerReferenceError,
} from "./xendit/client.js"
import { activateProSubscription } from "./activate.js"
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

class BillingService {
    async getOrganizationSubscription(organizationId: string) {
        await ensureBillingCatalog()

        const subscriptions = await prismaClient.subscription.findMany({
            where: {
                organizationId,
                status: { in: ["PENDING", "ACTIVE", "PAST_DUE"] },
            },
            include: { plan: true },
            orderBy: { startedAt: "desc" },
        })

        const subscription =
            subscriptions.find((s) => s.status === "ACTIVE") ??
            subscriptions.find((s) => s.status === "PENDING") ??
            subscriptions[0]

        const pendingPro = subscriptions.find(
            (s) => s.status === "PENDING" && s.plan.name === PLAN_NAMES.pro,
        )

        if (!subscription) {
            throw new AppError(404, "NOT_FOUND", "No subscription found for this organization")
        }

        return {
            planName: subscription.plan.name,
            status: subscription.status,
            billingMode: subscription.plan.billingMode,
            tokenLimit: subscription.plan.tokenLimit,
            requestLimit: subscription.plan.requestLimit,
            pendingPlanName: pendingPro ? pendingPro.plan.name : null,
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

        const sessionBody: Record<string, unknown> = {
            reference_id: referenceId,
            session_type: "PAY",
            mode: "COMPONENTS",
            amount: Number(amount),
            currency: "PHP",
            country: "PH",
            locale: "en",
            allow_save_payment_method: "FORCED",
            description: "Ainvoker Pro subscription",
            ...customerFields,
            metadata: {
                organizationId: input.organizationId,
                planName: PLAN_NAMES.pro,
                userId: input.userId,
                subscriptionId: pendingSub.id,
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

        await prismaClient.subscription.update({
            where: { id: pendingSub.id },
            data: { xenditSessionId: session.payment_session_id },
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

        if (
            eventName === "payment_session.completed" ||
            eventName === "payment.capture" ||
            eventName === "payment_token.activation"
        ) {
            const metadata = extractMetadata(data)
            if (!metadata?.organizationId || metadata.planName !== PLAN_NAMES.pro) {
                return { handled: true, skipped: true }
            }

            const paymentId =
                (data.payment_id as string | undefined) ??
                (data.id as string | undefined) ??
                (data.payment_session_id as string | undefined) ??
                `xendit_${Date.now()}`

            const paymentTokenId =
                (data.payment_token_id as string | undefined) ??
                (data.token_id as string | undefined)

            await activateProSubscription({
                organizationId: metadata.organizationId,
                paymentReference: paymentId,
                amountPhp: getProCheckoutAmountPhp(),
                ...(paymentTokenId ? { paymentTokenId } : {}),
            })

            return { handled: true, activated: true }
        }

        return { handled: true, ignored: eventName }
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

    return undefined
}

export default new BillingService()
