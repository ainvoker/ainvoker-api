import type { AIModel, Plan } from "../../generated/prisma/client.js"
import { AppError } from "../../platform/errors.js"
import prismaClient from "../../platform/prisma.js"
import { computeQuotaTokens, loadQuotaReference } from "../business/retail.js"
import { PLAN_NAMES } from "./catalog.js"

export async function getOrganizationOwnerUserId(organizationId: string): Promise<string | null> {
    const ownerRole = await prismaClient.role.findUnique({ where: { name: "owner" } })
    if (!ownerRole) return null
    const member = await prismaClient.organizationMember.findFirst({
        where: { organizationId, roleId: ownerRole.id },
        select: { userId: true },
    })
    return member?.userId ?? null
}

/** Free: freeEligible economy models only. Pro and Scale: everything. */
export function isModelAllowedOnPlan(
    planName: string,
    model: Pick<AIModel, "planTier" | "freeEligible">,
): boolean {
    if (planName === PLAN_NAMES.free) {
        return model.planTier === "ECONOMY" && model.freeEligible
    }
    return true
}

/** Premium models start disabled on a project; owners opt in. */
export function isModelEnabledByDefault(model: Pick<AIModel, "planTier">): boolean {
    return model.planTier !== "PREMIUM"
}

export function assertModelAllowedForPlan(
    plan: Pick<Plan, "name">,
    model: Pick<AIModel, "planTier" | "name" | "freeEligible">,
) {
    if (!isModelAllowedOnPlan(plan.name, model)) {
        throw new AppError(
            403,
            "MODEL_NOT_ALLOWED_ON_PLAN",
            `Model "${model.name}" is not available on the ${plan.name} plan`,
        )
    }
}

export async function quotaUnitsForHold(
    model: Pick<AIModel, "inputPrice" | "outputPrice">,
    inputTokens: number,
    outputTokens: number,
): Promise<number> {
    const reference = await loadQuotaReference()
    return computeQuotaTokens(inputTokens, outputTokens, model, reference)
}
