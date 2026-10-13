import { Prisma } from "../../generated/prisma/client.js"
import type { AIModel, AIProvider } from "../../generated/prisma/client.js"
import { AppError } from "../../platform/errors.js"
import prismaClient from "../../platform/prisma.js"
import { hasModelAdapter } from "../text/allowlist.js"
import type {
    CreateAdminModelInput,
    ListAdminModelsQuery,
    UpdateAdminModelInput,
} from "./schemas.js"

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
    inputPrice: string
    outputPrice: string
    status: AIModel["status"]
    freeEligible: boolean
    /** False when no adapter is registered for this provider and type; the model will not route. */
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
            inputPrice: model.inputPrice.toString(),
            outputPrice: model.outputPrice.toString(),
            status: model.status,
            freeEligible: model.freeEligible,
            routable: hasModelAdapter(model.type, model.provider.name),
            createdAt: model.createdAt.toISOString(),
            updatedAt: model.updatedAt.toISOString(),
        }
    }

    private assertFreeEligibleAllowed(type: AIModel["type"], freeEligible: boolean) {
        if (type === "IMAGE" && freeEligible) {
            throw new AppError(400, "VALIDATION_ERROR", "Image models cannot be available on the Free plan")
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

    async createModel(input: CreateAdminModelInput): Promise<AdminModelItem> {
        const provider = await prismaClient.aIProvider.findUnique({
            where: { id: input.providerId },
        })
        if (!provider) {
            throw new AppError(404, "NOT_FOUND", "Provider not found")
        }
        if (input.status === "ACTIVE" && provider.status !== "ACTIVE") {
            throw new AppError(
                400,
                "VALIDATION_ERROR",
                `Provider "${provider.name}" is not active; create the model as INACTIVE instead`,
            )
        }
        this.assertFreeEligibleAllowed(input.type, input.freeEligible)

        try {
            const model = await prismaClient.aIModel.create({
                data: {
                    providerId: provider.id,
                    name: input.name,
                    type: input.type,
                    contextWindow: input.contextWindow,
                    inputPrice: new Prisma.Decimal(input.inputPrice),
                    outputPrice: new Prisma.Decimal(input.outputPrice),
                    status: input.status,
                    freeEligible: input.freeEligible,
                },
                include: { provider: { select: { name: true } } },
            })
            return this.serializeModel(model)
        } catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
                throw new AppError(
                    409,
                    "CONFLICT",
                    `Model "${provider.name}/${input.name}" already exists`,
                )
            }
            throw err
        }
    }

    async updateModel(modelId: number, input: UpdateAdminModelInput): Promise<AdminModelItem> {
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
        this.assertFreeEligibleAllowed(existing.type, input.freeEligible ?? existing.freeEligible)

        const model = await prismaClient.aIModel.update({
            where: { id: modelId },
            data: {
                ...(input.contextWindow !== undefined ? { contextWindow: input.contextWindow } : {}),
                ...(input.inputPrice !== undefined
                    ? { inputPrice: new Prisma.Decimal(input.inputPrice) }
                    : {}),
                ...(input.outputPrice !== undefined
                    ? { outputPrice: new Prisma.Decimal(input.outputPrice) }
                    : {}),
                ...(input.status !== undefined ? { status: input.status } : {}),
                ...(input.freeEligible !== undefined ? { freeEligible: input.freeEligible } : {}),
            },
            include: { provider: { select: { name: true } } },
        })
        return this.serializeModel(model)
    }
}

export default new AdminModelsService()
