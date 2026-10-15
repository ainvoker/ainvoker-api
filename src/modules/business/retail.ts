import { Prisma } from "../../generated/prisma/client.js"
import type { AIModel, AIModelType, ModelPlanTier } from "../../generated/prisma/client.js"
import prismaClient from "../../platform/prisma.js"

export type BusinessSettingsRow = {
    economyMarkupMultiplier: Prisma.Decimal
    premiumMarkupMultiplier: Prisma.Decimal
    imageMarkupMultiplier: Prisma.Decimal
    usdToPhpRate: Prisma.Decimal
    quotaReferenceModelId: number | null
    scaleAdvanceCentavos: number
}

export function markupForModel(
    settings: BusinessSettingsRow,
    type: AIModelType,
    planTier: ModelPlanTier,
): Prisma.Decimal {
    if (type === "IMAGE") {
        return settings.imageMarkupMultiplier
    }
    if (planTier === "ECONOMY") {
        return settings.economyMarkupMultiplier
    }
    return settings.premiumMarkupMultiplier
}

export function retailFromProvider(
    providerPrice: Prisma.Decimal,
    markup: Prisma.Decimal,
): Prisma.Decimal {
    return providerPrice.mul(markup)
}

export async function ensureBusinessSettings(): Promise<
    BusinessSettingsRow & { id: number; updatedAt: Date }
> {
    const row = await prismaClient.platformBusinessSettings.upsert({
        where: { id: 1 },
        create: { id: 1 },
        update: {},
    })
    return row
}

export function retailPricesForModel(
    settings: BusinessSettingsRow,
    model: Pick<AIModel, "type" | "planTier" | "providerInputPrice" | "providerOutputPrice">,
): { inputPrice: Prisma.Decimal; outputPrice: Prisma.Decimal } {
    const markup = markupForModel(settings, model.type, model.planTier)
    return {
        inputPrice: retailFromProvider(model.providerInputPrice, markup),
        outputPrice: retailFromProvider(model.providerOutputPrice, markup),
    }
}

export async function recomputeAllModelRetailPrices(): Promise<number> {
    const settings = await ensureBusinessSettings()
    const models = await prismaClient.aIModel.findMany()
    let updated = 0
    for (const model of models) {
        await prismaClient.aIModel.update({
            where: { id: model.id },
            data: retailPricesForModel(settings, model),
        })
        updated += 1
    }
    return updated
}

export type QuotaReference = Pick<AIModel, "inputPrice" | "outputPrice">

export async function loadQuotaReference(): Promise<QuotaReference> {
    const settings = await ensureBusinessSettings()
    if (settings.quotaReferenceModelId != null) {
        const ref = await prismaClient.aIModel.findUnique({
            where: { id: settings.quotaReferenceModelId },
            select: { inputPrice: true, outputPrice: true },
        })
        if (ref) return ref
    }
    const fallback = await prismaClient.aIModel.findFirst({
        where: { name: "gpt-4o-mini", status: "ACTIVE" },
        select: { inputPrice: true, outputPrice: true },
    })
    if (!fallback) {
        return {
            inputPrice: new Prisma.Decimal(0.15),
            outputPrice: new Prisma.Decimal(0.6),
        }
    }
    return fallback
}

export function computeQuotaTokens(
    inputTokens: number,
    outputTokens: number,
    model: Pick<AIModel, "inputPrice" | "outputPrice">,
    reference: QuotaReference,
): number {
    const refIn = new Prisma.Decimal(reference.inputPrice)
    const refOut = new Prisma.Decimal(reference.outputPrice)
    if (refIn.lte(0) && refOut.lte(0)) {
        return inputTokens + outputTokens
    }
    const wIn = refIn.lte(0) ? new Prisma.Decimal(1) : new Prisma.Decimal(model.inputPrice).div(refIn)
    const wOut = refOut.lte(0) ? new Prisma.Decimal(1) : new Prisma.Decimal(model.outputPrice).div(refOut)
    const units = new Prisma.Decimal(inputTokens)
        .mul(wIn)
        .add(new Prisma.Decimal(outputTokens).mul(wOut))
    return Math.max(1, Math.ceil(units.toNumber()))
}
