import { Prisma } from "../../generated/prisma/client.js"
import {
    assertModelAllowedForPlan,
    getActiveSubscriptionWithPlan,
    reservePendingTextRequest,
    type QuotaSnapshot,
} from "../billing/limits.js"
import { AppError } from "../../platform/errors.js"
import prismaClient from "../../platform/prisma.js"
import chatProviderRegistry from "../../providers/index.js"
import type {
    AssistantMessage,
    ChatCompletionUsage,
    ChatProvider,
    ChatStream,
    ToolCall,
} from "../../providers/types.js"
import type { ApiKeyContext } from "../../types/express.js"
import { ensureTextCatalog } from "./catalog.js"
import { isModelSlug, parseModelSlug, type TextChatBody } from "./schemas.js"
import { estimateTextTokenHold } from "./tokens.js"

export type TextChatResult = {
    id: string
    model: string
    message: AssistantMessage
    usage: ChatCompletionUsage | null
    quota: QuotaSnapshot
}

export type TextStreamGatewayEvent =
    | { type: "delta"; content: string }
    | ({ type: "tool_call" } & ToolCall)
    | { type: "done"; message: AssistantMessage; usage: ChatCompletionUsage | null }
    | { type: "error"; code: string; message: string }

export type TextStreamSession = {
    id: string
    model: string
    quota: QuotaSnapshot
    /** Abort the upstream provider stream (client disconnect). */
    abort: () => void
    /**
     * Yields gateway events after headers/meta. Persists SUCCESS or FAILED.
     * Does not yield `meta` (the route writes that once).
     */
    events: () => AsyncGenerator<TextStreamGatewayEvent>
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

type PreparedTextCall = {
    model: ResolvedModel
    modelSlug: string
    body: TextChatBody
    adapter: ChatProvider
    aiRequest: { id: string }
    quota: QuotaSnapshot
    tokenHold: { inputTokens: number; outputTokens: number }
}

class TextService {
    private async resolveModel(modelInput: string): Promise<ResolvedModel> {
        if (isModelSlug(modelInput)) {
            const { providerName, modelName } = parseModelSlug(modelInput)
            const modelSlug = `${providerName}/${modelName}`

            const provider = await prismaClient.aIProvider.findUnique({
                where: { name: providerName },
            })
            if (!provider || provider.status !== "ACTIVE") {
                throw new AppError(404, "NOT_FOUND", `Unknown or inactive provider "${providerName}"`)
            }

            if (!chatProviderRegistry.has(providerName)) {
                throw new AppError(404, "NOT_FOUND", `Unknown or inactive text model "${modelSlug}"`)
            }

            const model = await prismaClient.aIModel.findUnique({
                where: {
                    providerId_name: {
                        providerId: provider.id,
                        name: modelName,
                    },
                },
            })
            if (!model || model.status !== "ACTIVE" || model.type !== "TEXT") {
                throw new AppError(404, "NOT_FOUND", `Unknown or inactive text model "${modelSlug}"`)
            }

            return {
                id: model.id,
                name: model.name,
                freeEligible: model.freeEligible,
                inputPrice: model.inputPrice,
                outputPrice: model.outputPrice,
                providerName: provider.name,
                providerBaseUrl: provider.baseUrl,
            }
        }

        const matches = await prismaClient.aIModel.findMany({
            where: {
                name: modelInput,
                type: "TEXT",
                status: "ACTIVE",
                provider: { status: "ACTIVE" },
            },
            include: { provider: true },
        })

        const routable = matches.filter((row) => chatProviderRegistry.has(row.provider.name))

        if (routable.length === 0) {
            throw new AppError(404, "NOT_FOUND", `Unknown or inactive text model "${modelInput}"`)
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

    private async prepareTextCall(
        apiKeyContext: ApiKeyContext,
        body: TextChatBody,
    ): Promise<PreparedTextCall> {
        await ensureTextCatalog()

        const [modelResult, subscriptionResult] = await Promise.allSettled([
            this.resolveModel(body.model),
            getActiveSubscriptionWithPlan(apiKeyContext.organizationId),
        ])
        // Model errors (404/400) take precedence over subscription errors (402).
        if (modelResult.status === "rejected") {
            throw modelResult.reason
        }
        if (subscriptionResult.status === "rejected") {
            throw subscriptionResult.reason
        }
        const model = modelResult.value
        const modelSlug = `${model.providerName}/${model.name}`

        assertModelAllowedForPlan(subscriptionResult.value.plan, model)

        const adapter = chatProviderRegistry.get(model.providerName)

        const requestedHold = estimateTextTokenHold(body.messages, body.maxTokens, body.tools)
        const requestPayload = {
            model: modelSlug,
            messages: body.messages,
            ...(body.tools !== undefined ? { tools: body.tools } : {}),
            ...(body.temperature !== undefined ? { temperature: body.temperature } : {}),
            ...(body.maxTokens !== undefined ? { maxTokens: body.maxTokens } : {}),
            ...(body.reasoning !== undefined ? { reasoning: body.reasoning } : {}),
        } as Prisma.InputJsonObject

        const { aiRequest, quota, tokenHold } = await reservePendingTextRequest({
            organizationId: apiKeyContext.organizationId,
            projectId: apiKeyContext.projectId,
            apiKeyId: apiKeyContext.apiKeyId,
            modelId: model.id,
            requestPayload,
            reservedInputTokens: requestedHold.inputTokens,
            reservedOutputTokens: requestedHold.outputTokens,
            allowOutputShrink: body.maxTokens === undefined,
        })

        return { model, modelSlug, body, adapter, aiRequest, quota, tokenHold }
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

    private async markSuccess(input: {
        aiRequestId: string
        message: AssistantMessage
        usage: ChatCompletionUsage | null
        raw: unknown
        tokenHold: { inputTokens: number; outputTokens: number }
        model: ResolvedModel
        latency: number
    }) {
        const { usage, tokenHold } = input
        const responsePayload = {
            message: input.message as Prisma.InputJsonObject,
            usage,
            raw: input.raw as Prisma.InputJsonValue,
        } satisfies Prisma.InputJsonObject

        await prismaClient.aIRequest.update({
            where: { id: input.aiRequestId },
            data: {
                requestStatus: "SUCCESS",
                responsePayload,
                // Keep the hold when the provider omits usage so the cap is not released blind.
                inputTokens: usage?.inputTokens ?? tokenHold.inputTokens,
                outputTokens: usage?.outputTokens ?? tokenHold.outputTokens,
                totalTokens: usage?.totalTokens ?? tokenHold.inputTokens + tokenHold.outputTokens,
                latency: input.latency,
                requestCost: this.computeRequestCost(input.model, usage),
            },
        })
    }

    private async markFailed(input: {
        aiRequestId: string
        err: unknown
        latency: number
        fallbackMessage: string
    }) {
        const message =
            input.err instanceof Error ? input.err.message : input.fallbackMessage
        const code = input.err instanceof AppError ? input.err.code : "INTERNAL_ERROR"

        await prismaClient.aIRequest.update({
            where: { id: input.aiRequestId },
            data: {
                requestStatus: "FAILED",
                responsePayload: { error: { code, message } },
                latency: input.latency,
                // Release the in-flight hold. The FAILED row still counts as a request.
                inputTokens: null,
                outputTokens: null,
                totalTokens: null,
            },
        })

        return { code, message }
    }

    async chat(apiKeyContext: ApiKeyContext, body: TextChatBody): Promise<TextChatResult> {
        const prepared = await this.prepareTextCall(apiKeyContext, body)
        const { model, modelSlug, adapter, aiRequest, quota, tokenHold } = prepared
        const started = Date.now()

        try {
            const result = await adapter.complete({
                model: model.name,
                messages: body.messages,
                ...(body.tools !== undefined ? { tools: body.tools } : {}),
                baseUrl: model.providerBaseUrl,
                ...(body.temperature !== undefined ? { temperature: body.temperature } : {}),
                ...(body.reasoning !== undefined ? { reasoning: body.reasoning } : {}),
                // Cap completion at the reserved output so actual usage cannot pass the hold.
                maxTokens: tokenHold.outputTokens,
            })

            await this.markSuccess({
                aiRequestId: aiRequest.id,
                message: result.message,
                usage: result.usage,
                raw: result.raw,
                tokenHold,
                model,
                latency: Date.now() - started,
            })

            return {
                id: aiRequest.id,
                model: modelSlug,
                message: result.message,
                usage: result.usage,
                quota,
            }
        } catch (err) {
            await this.markFailed({
                aiRequestId: aiRequest.id,
                err,
                latency: Date.now() - started,
                fallbackMessage: "Chat request failed",
            })
            throw err
        }
    }

    /**
     * Reserve quota and open the upstream stream. Throws AppError (JSON) before SSE
     * when prepare or openStream fails. After return, the route may write SSE headers.
     */
    async stream(apiKeyContext: ApiKeyContext, body: TextChatBody): Promise<TextStreamSession> {
        const prepared = await this.prepareTextCall(apiKeyContext, body)
        const { model, modelSlug, adapter, aiRequest, quota, tokenHold } = prepared
        const started = Date.now()
        const abortController = new AbortController()

        let upstream: ChatStream
        try {
            upstream = await adapter.openStream(
                {
                    model: model.name,
                    messages: body.messages,
                    ...(body.tools !== undefined ? { tools: body.tools } : {}),
                    baseUrl: model.providerBaseUrl,
                    ...(body.temperature !== undefined ? { temperature: body.temperature } : {}),
                    ...(body.reasoning !== undefined ? { reasoning: body.reasoning } : {}),
                    maxTokens: tokenHold.outputTokens,
                },
                { signal: abortController.signal },
            )
        } catch (err) {
            await this.markFailed({
                aiRequestId: aiRequest.id,
                err,
                latency: Date.now() - started,
                fallbackMessage: "Stream request failed",
            })
            throw err
        }

        let finalized = false

        const events = async function* (
            this: TextService,
        ): AsyncGenerator<TextStreamGatewayEvent> {
            let content = ""
            const toolCalls: ToolCall[] = []
            let usage: ChatCompletionUsage | null = null

            try {
                for await (const event of upstream) {
                    if (abortController.signal.aborted) {
                        break
                    }
                    if (event.type === "delta") {
                        content += event.content
                        yield { type: "delta", content: event.content }
                    } else if (event.type === "tool_call") {
                        const { type: _type, ...call } = event
                        toolCalls.push(call)
                        yield { type: "tool_call", ...call }
                    } else if (event.type === "usage") {
                        usage = event.usage
                    }
                }

                if (abortController.signal.aborted) {
                    return
                }

                if (!content && toolCalls.length === 0) {
                    const failure = new AppError(
                        502,
                        "UPSTREAM_ERROR",
                        "Upstream returned no assistant message",
                    )
                    if (!finalized) {
                        finalized = true
                        await this.markFailed({
                            aiRequestId: aiRequest.id,
                            err: failure,
                            latency: Date.now() - started,
                            fallbackMessage: failure.message,
                        })
                    }
                    yield { type: "error", code: failure.code, message: failure.message }
                    return
                }

                const message: AssistantMessage = {
                    role: "assistant",
                    content,
                    ...(toolCalls.length > 0 ? { toolCalls } : {}),
                }
                if (!finalized) {
                    finalized = true
                    await this.markSuccess({
                        aiRequestId: aiRequest.id,
                        message,
                        usage,
                        raw: upstream.rawChunks,
                        tokenHold,
                        model,
                        latency: Date.now() - started,
                    })
                }
                yield { type: "done", message, usage }
            } catch (err) {
                if (abortController.signal.aborted) {
                    return
                }

                if (!finalized) {
                    finalized = true
                    const { code, message } = await this.markFailed({
                        aiRequestId: aiRequest.id,
                        err,
                        latency: Date.now() - started,
                        fallbackMessage: "Stream request failed",
                    })
                    yield { type: "error", code, message }
                }
            } finally {
                if (!finalized && abortController.signal.aborted) {
                    finalized = true
                    await this.markFailed({
                        aiRequestId: aiRequest.id,
                        err: new AppError(499, "CLIENT_CLOSED", "Client disconnected"),
                        latency: Date.now() - started,
                        fallbackMessage: "Client disconnected",
                    })
                }
            }
        }.bind(this)

        return {
            id: aiRequest.id,
            model: modelSlug,
            quota,
            abort: () => {
                if (!abortController.signal.aborted) {
                    abortController.abort()
                }
            },
            events,
        }
    }
}

export default new TextService()
