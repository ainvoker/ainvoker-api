import { Prisma } from "../../generated/prisma/client.js"
import {
    assertModelAllowedForPlan,
    getActiveSubscriptionWithPlan,
    reservePendingImageRequest,
    type QuotaSnapshot,
} from "../billing/limits.js"
import { AppError } from "../../platform/errors.js"
import prismaClient from "../../platform/prisma.js"
import { imageProviderRegistry } from "../../providers/index.js"
import type { ChatCompletionUsage, GeneratedImage } from "../../providers/types.js"
import type { ApiKeyContext } from "../../types/express.js"
import { isModelSlug, parseModelSlug } from "../text/schemas.js"
import { ensureImageCatalog } from "./catalog.js"
import type { ImageGenerateBody } from "./schemas.js"

/**
 * Output tokens reserved per requested image. Covers the largest quality at the
 * supported sizes (about 7k tokens for "max" at 1024x1024).
 */
export const IMAGE_OUTPUT_TOKEN_HOLD = 8000

export type ImageGenerateResult = {
    id: string
    model: string
    images: GeneratedImage[]
    usage: ChatCompletionUsage | null
    quota: QuotaSnapshot
}

type ResolvedModel = {
    id: number
    name: string
    freeEligible: boolean
    inputPrice: Prisma.Decimal
    outputPrice: Prisma.Decimal
    providerName: string
    providerBaseUrl: string
}

class ImageService {
    private async resolveModel(modelInput: string): Promise<ResolvedModel> {
        const slug = isModelSlug(modelInput) ? parseModelSlug(modelInput) : null
        const models = await prismaClient.aIModel.findMany({
            where: {
                type: "IMAGE",
                status: "ACTIVE",
                name: slug?.modelName ?? modelInput,
                provider: {
                    status: "ACTIVE",
                    ...(slug ? { name: slug.providerName } : {}),
                },
            },
            include: { provider: true },
        })

        const routable = models.filter((row) => imageProviderRegistry.has(row.provider.name))
        if (routable.length === 0) {
            throw new AppError(404, "NOT_FOUND", `Unknown or inactive image model "${modelInput}"`)
        }
        if (routable.length > 1) {
            throw new AppError(
                400,
                "VALIDATION_ERROR",
                `Model name "${modelInput}" is ambiguous; pass provider/model (e.g. openai/${modelInput})`,
            )
        }

        const model = routable[0]!
        return {
            id: model.id,
            name: model.name,
            freeEligible: model.freeEligible,
            inputPrice: model.inputPrice,
            outputPrice: model.outputPrice,
            providerName: model.provider.name,
            providerBaseUrl: model.provider.baseUrl,
        }
    }

    private computeRequestCost(
        model: ResolvedModel,
        usage: ChatCompletionUsage | null,
    ): Prisma.Decimal | null {
        if (usage == null) {
            return null
        }
        return new Prisma.Decimal(model.inputPrice)
            .mul(usage.inputTokens)
            .div(1_000_000)
            .add(new Prisma.Decimal(model.outputPrice).mul(usage.outputTokens).div(1_000_000))
    }

    async generate(apiKeyContext: ApiKeyContext, body: ImageGenerateBody): Promise<ImageGenerateResult> {
        await ensureImageCatalog()

        const [modelResult, subscriptionResult] = await Promise.allSettled([
            this.resolveModel(body.model),
            getActiveSubscriptionWithPlan(apiKeyContext.organizationId),
        ])
        if (modelResult.status === "rejected") {
            throw modelResult.reason
        }
        if (subscriptionResult.status === "rejected") {
            throw subscriptionResult.reason
        }
        const model = modelResult.value
        const modelSlug = `${model.providerName}/${model.name}`

        assertModelAllowedForPlan(subscriptionResult.value.plan, model)

        const adapter = imageProviderRegistry.get(model.providerName)
        const n = body.n ?? 1

        const { aiRequest, quota, tokenHold } = await reservePendingImageRequest({
            organizationId: apiKeyContext.organizationId,
            projectId: apiKeyContext.projectId,
            apiKeyId: apiKeyContext.apiKeyId,
            modelId: model.id,
            requestPayload: { ...body, model: modelSlug } as Prisma.InputJsonObject,
            reservedInputTokens: body.prompt.length,
            reservedOutputTokens: IMAGE_OUTPUT_TOKEN_HOLD * n,
        })

        const started = Date.now()
        try {
            const result = await adapter.generate({
                model: model.name,
                prompt: body.prompt,
                n,
                ...(body.size !== undefined ? { size: body.size } : {}),
                ...(body.quality !== undefined ? { quality: body.quality } : {}),
                ...(body.outputFormat !== undefined ? { outputFormat: body.outputFormat } : {}),
                baseUrl: model.providerBaseUrl,
            })

            const { usage } = result
            await prismaClient.aIRequest.update({
                where: { id: aiRequest.id },
                data: {
                    requestStatus: "SUCCESS",
                    responsePayload: {
                        imageCount: result.images.length,
                        usage,
                        raw: result.raw as Prisma.InputJsonValue,
                    },
                    // Keep the hold when the provider omits usage so the cap is not released blind.
                    inputTokens: usage?.inputTokens ?? tokenHold.inputTokens,
                    outputTokens: usage?.outputTokens ?? tokenHold.outputTokens,
                    totalTokens: usage?.totalTokens ?? tokenHold.inputTokens + tokenHold.outputTokens,
                    latency: Date.now() - started,
                    requestCost: this.computeRequestCost(model, usage),
                },
            })

            return {
                id: aiRequest.id,
                model: modelSlug,
                images: result.images,
                usage,
                quota,
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : "Image request failed"
            const code = err instanceof AppError ? err.code : "INTERNAL_ERROR"
            await prismaClient.aIRequest.update({
                where: { id: aiRequest.id },
                data: {
                    requestStatus: "FAILED",
                    responsePayload: { error: { code, message } },
                    latency: Date.now() - started,
                    // Release the in-flight hold. The FAILED row still counts as a request.
                    inputTokens: null,
                    outputTokens: null,
                    totalTokens: null,
                },
            })
            throw err
        }
    }
}

export default new ImageService()
