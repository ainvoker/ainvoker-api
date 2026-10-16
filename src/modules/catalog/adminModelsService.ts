import type { AIModel, AIProvider } from "../../generated/prisma/client.js"
import { AppError } from "../../platform/errors.js"
import prismaClient from "../../platform/prisma.js"
import { AUDIT_ACTIONS } from "../audit/actions.js"
import { recordAuditEvent } from "../audit/record.js"
import { ensureBusinessSettings, retailPricesForModel } from "../business/retail.js"
import { hasModelAdapter } from "../text/allowlist.js"
import type { ListAdminModelsQuery, UpdateAdminModelInput } from "./schemas.js"

export type AdminProviderItem = {
    id: number
    name: string
    baseUrl: string
    documentation: string | null
    status: AIProvider["status"]
    hasTextAdapter: boolean
    hasImageAdapter: boolean
}

export type AdminModelItem = {
    id: number
    providerId: number
    provider: string
    name: string
    slug: string
    type: AIModel["type"]
    contextWindow: number
    providerInputPrice: string
    providerOutputPrice: string
    inputPrice: string
    outputPrice: string
    planTier: AIModel["planTier"]
    status: AIModel["status"]
    freeEligible: boolean
    routable: boolean
    createdAt: string
    updatedAt: string
}

type ModelWithProvider = AIModel & { provider: Pick<AIProvider, "name"> }

class AdminModelsService {
    private serializeModel(model: ModelWithProvider): AdminModelItem {
        return {
            id: model.id,
            providerId: model.providerId,
            provider: model.provider.name,
            name: model.name,
            slug: `${model.provider.name}/${model.name}`,
            type: model.type,
            contextWindow: model.contextWindow,
            providerInputPrice: model.providerInputPrice.toString(),
            providerOutputPrice: model.providerOutputPrice.toString(),
            inputPrice: model.inputPrice.toString(),
            outputPrice: model.outputPrice.toString(),
            planTier: model.planTier,
            status: model.status,
            freeEligible: model.freeEligible,
            routable: hasModelAdapter(model.type, model.provider.name),
            createdAt: model.createdAt.toISOString(),
            updatedAt: model.updatedAt.toISOString(),
        }
    }

    async listProviders(): Promise<AdminProviderItem[]> {
        const providers = await prismaClient.aIProvider.findMany({ orderBy: { name: "asc" } })
        return providers.map((provider) => ({
            id: provider.id,
            name: provider.name,
            baseUrl: provider.baseUrl,
            documentation: provider.documentation,
            status: provider.status,
            hasTextAdapter: hasModelAdapter("TEXT", provider.name),
            hasImageAdapter: hasModelAdapter("IMAGE", provider.name),
        }))
    }

    async listModels(query: ListAdminModelsQuery): Promise<AdminModelItem[]> {
        const models = await prismaClient.aIModel.findMany({
            where: {
                ...(query.type !== undefined ? { type: query.type } : {}),
                ...(query.status !== undefined ? { status: query.status } : {}),
                ...(query.providerId !== undefined ? { providerId: query.providerId } : {}),
            },
            include: { provider: { select: { name: true } } },
            orderBy: [{ type: "asc" }, { provider: { name: "asc" } }, { name: "asc" }],
        })
        return models.map((model) => this.serializeModel(model))
    }

    async getModel(modelId: number): Promise<AdminModelItem> {
        const model = await prismaClient.aIModel.findUnique({
            where: { id: modelId },
            include: { provider: { select: { name: true } } },
        })
        if (!model) {
            throw new AppError(404, "NOT_FOUND", "Model not found")
        }
        return this.serializeModel(model)
    }

    async updateModel(
        modelId: number,
        input: UpdateAdminModelInput,
        actorUserId: string,
    ): Promise<AdminModelItem> {
        const existing = await prismaClient.aIModel.findUnique({
            where: { id: modelId },
            include: { provider: { select: { name: true, status: true } } },
        })
        if (!existing) {
            throw new AppError(404, "NOT_FOUND", "Model not found")
        }
        if (input.status === "ACTIVE" && existing.provider.status !== "ACTIVE") {
            throw new AppError(
                400,
                "VALIDATION_ERROR",
                `Provider "${existing.provider.name}" is not active`,
            )
        }

        const planTier = input.planTier ?? existing.planTier
        if (planTier === "PREMIUM" && input.freeEligible === true) {
            throw new AppError(
                400,
                "VALIDATION_ERROR",
                "Premium models cannot be available on the Free plan",
            )
        }
        const freeEligible =
            planTier === "PREMIUM" ? false : (input.freeEligible ?? existing.freeEligible)

        const retail =
            planTier !== existing.planTier
                ? retailPricesForModel(await ensureBusinessSettings(), { ...existing, planTier })
                : {}

        const model = await prismaClient.aIModel.update({
            where: { id: modelId },
            data: {
                ...(input.status !== undefined ? { status: input.status } : {}),
                planTier,
                freeEligible,
                ...retail,
            },
            include: { provider: { select: { name: true } } },
        })

        await recordAuditEvent({
            actorUserId,
            actorType: "PLATFORM_ADMIN",
            action: AUDIT_ACTIONS.modelUpdated,
            targetType: "model",
            targetId: String(modelId),
            summary: `Model ${existing.provider.name}/${existing.name} updated`,
            metadata: {
                before: {
                    status: existing.status,
                    planTier: existing.planTier,
                    freeEligible: existing.freeEligible,
                },
                after: {
                    status: model.status,
                    planTier: model.planTier,
                    freeEligible: model.freeEligible,
                },
            },
        })

        return this.serializeModel(model)
    }
}

export default new AdminModelsService()
