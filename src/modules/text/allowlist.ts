import type { Prisma } from "../../generated/prisma/client.js"
import prismaClient from "../../platform/prisma.js"
import chatProviderRegistry from "../../providers/index.js"
import { getActiveSubscriptionWithPlan } from "../billing/limits.js"
import { PLAN_NAMES } from "../billing/catalog.js"
import { ensureTextCatalog } from "./catalog.js"

type DbClient = Prisma.TransactionClient | typeof prismaClient

/**
 * ACTIVE text model ids the org plan may use that also have a chat adapter.
 */
export async function listPlanAllowedRoutableModelIds(
    organizationId: string,
    db: DbClient = prismaClient,
): Promise<number[]> {
    await ensureTextCatalog()

    const subscription = await getActiveSubscriptionWithPlan(organizationId)
    const planName = subscription.plan.name

    const models = await db.aIModel.findMany({
        where: {
            type: "TEXT",
            status: "ACTIVE",
            provider: { status: "ACTIVE" },
            ...(planName === PLAN_NAMES.free ? { freeEligible: true } : {}),
        },
        include: { provider: { select: { name: true } } },
    })

    return models
        .filter((model) => chatProviderRegistry.has(model.provider.name))
        .map((model) => model.id)
}

/**
 * Insert enabled:true allow rows for plan-allowed ACTIVE text models that have a
 * registered chat adapter. Never updates existing rows (owner disabled stays off).
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
