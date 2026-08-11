import env from "../../config/env.js"
import { AppError } from "../../platform/errors.js"
import prismaClient from "../../platform/prisma.js"
import {
    ensureBillingCatalog,
    getPlanByName,
    getProCheckoutAmountPhp,
    PLAN_NAMES,
} from "./catalog.js"
import { createXenditSession } from "./xendit/client.js"
import { activateProSubscription } from "./activate.js"

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

async function ensureXenditCustomerReference(organizationId: string) {
    const org = await prismaClient.organization.findUniqueOrThrow({
        where: { id: organizationId },
        select: { id: true, xenditCustomerReference: true },
    })

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
        const customerReference = await ensureXenditCustomerReference(input.organizationId)
        const amount = getProCheckoutAmountPhp()
        const referenceId = `pro_${input.organizationId}_${Date.now()}`

        const session = await createXenditSession({
            reference_id: referenceId,
            session_type: "PAY",
            mode: "COMPONENTS",
            amount: Number(amount),
            currency: "PHP",
            country: "PH",
            locale: "en",
            allow_save_payment_method: "FORCED",
            description: "Ainvoker Pro subscription",
            customer: {
                reference_id: customerReference,
                type: "INDIVIDUAL",
                email: user.email ?? undefined,
                individual_detail: {
                    given_names: user.firstName ?? "Ainvoker",
                    surname: user.lastName ?? "User",
                },
            },
            metadata: {
                organizationId: input.organizationId,
                planName: PLAN_NAMES.pro,
                userId: input.userId,
                subscriptionId: pendingSub.id,
            },
            components_configuration: {
                origins: env.getXenditComponentsOrigins(),
                // Must match the real SPA URL the browser is on (http OK locally).
                return_url: input.returnUrl,
            },
        })

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
