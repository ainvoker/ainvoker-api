import type { AIModelType, Prisma } from "../../generated/prisma/client.js"
import prismaClient from "../../platform/prisma.js"
import { chatProviderRegistry, imageProviderRegistry } from "../../providers/index.js"
import { getActiveSubscriptionWithPlan } from "../billing/limits.js"
import { PLAN_NAMES } from "../billing/catalog.js"
import { ensureImageCatalog } from "../image/catalog.js"

type DbClient = Prisma.TransactionClient | typeof prismaClient

/** Model types the gateway can route. Seeds both catalogs. */
export const ROUTABLE_MODEL_TYPES = ["TEXT", "IMAGE"] satisfies AIModelType[]

export async function ensureRoutableCatalog(): Promise<void> {
    // The image seed runs the text seed first.
    await ensureImageCatalog()
}

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

/**
 * ACTIVE text and image model ids the org plan may use that also have an adapter.
 */
export async function listPlanAllowedRoutableModelIds(
    organizationId: string,
    db: DbClient = prismaClient,
): Promise<number[]> {
    await ensureRoutableCatalog()

    const subscription = await getActiveSubscriptionWithPlan(organizationId)
    const planName = subscription.plan.name

    const models = await db.aIModel.findMany({
        where: {
            type: { in: ROUTABLE_MODEL_TYPES },
            status: "ACTIVE",
            provider: { status: "ACTIVE" },
            ...(planName === PLAN_NAMES.free ? { freeEligible: true } : {}),
        },
        include: { provider: { select: { name: true } } },
    })

    return models
        .filter((model) => hasModelAdapter(model.type, model.provider.name))
        .map((model) => model.id)
}

/**
 * Insert enabled:true allow rows for plan-allowed ACTIVE models that have a
 * registered adapter. Never updates existing rows (owner disabled stays off).
 */
export async function backfillProjectModelAllows(
    projectId: string,
    organizationId: string,
    db: DbClient = prismaClient,
): Promise<void> {
    const modelIds = await listPlanAllowedRoutableModelIds(organizationId, db)
    if (modelIds.length === 0) {
        return
    }

    await db.projectModelAllow.createMany({
        data: modelIds.map((modelId) => ({
            projectId,
            modelId,
            enabled: true,
        })),
        skipDuplicates: true,
    })
}

export function isModelAllowedOnPlan(planName: string, freeEligible: boolean): boolean {
    if (planName !== PLAN_NAMES.free) {
        return true
    }
    return freeEligible
}
