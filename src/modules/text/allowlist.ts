import type { AIModelType, Prisma } from "../../generated/prisma/client.js"
import prismaClient from "../../platform/prisma.js"
import { chatProviderRegistry, imageProviderRegistry } from "../../providers/index.js"
import { getActiveSubscriptionWithPlan } from "../billing/limits.js"
import { PLAN_NAMES } from "../billing/catalog.js"
import { isModelEnabledByDefault } from "../billing/quotaHelpers.js"

type DbClient = Prisma.TransactionClient | typeof prismaClient

/** Model types the gateway can route. */
export const ROUTABLE_MODEL_TYPES = ["TEXT", "IMAGE"] satisfies AIModelType[]

/** True when an adapter is registered for this model's type and provider. */
export function hasModelAdapter(type: AIModelType, providerName: string): boolean {
    if (type === "TEXT") {
        return chatProviderRegistry.has(providerName)
    }
    if (type === "IMAGE") {
        return imageProviderRegistry.has(providerName)
    }
    return false
}

export type DefaultModelAllow = { modelId: number; enabled: boolean }

/**
 * ACTIVE text and image models the org plan may use that also have an adapter,
 * with the enabled state a new allow row should start with.
 */
export async function listDefaultModelAllows(
    organizationId: string,
    db: DbClient = prismaClient,
): Promise<DefaultModelAllow[]> {
    const subscription = await getActiveSubscriptionWithPlan(organizationId)
    const planName = subscription.plan.name

    const models = await db.aIModel.findMany({
        where: {
            type: { in: ROUTABLE_MODEL_TYPES },
            status: "ACTIVE",
            provider: { status: "ACTIVE" },
            ...(planName === PLAN_NAMES.free ? { planTier: "ECONOMY", freeEligible: true } : {}),        },
        include: { provider: { select: { name: true } } },
    })

    return models
        .filter((model) => hasModelAdapter(model.type, model.provider.name))
        .map((model) => ({ modelId: model.id, enabled: isModelEnabledByDefault(model) }))
}

/**
 * Insert allow rows for plan-allowed ACTIVE models that have a registered adapter
 * (premium disabled, others enabled). Never updates existing rows.
 */
export async function backfillProjectModelAllows(
    projectId: string,
    organizationId: string,
    db: DbClient = prismaClient,
): Promise<void> {
    const allows = await listDefaultModelAllows(organizationId, db)
    if (allows.length === 0) {
        return
    }

    await db.projectModelAllow.createMany({
        data: allows.map((allow) => ({ projectId, ...allow })),
        skipDuplicates: true,
    })
}