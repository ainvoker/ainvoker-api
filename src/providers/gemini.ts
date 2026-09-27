import env from "../config/env.js"
import { AppError } from "../platform/errors.js"
import { parseSseDataPayloads } from "./sse.js"
import type {
    ChatCompletionInput,
    ChatCompletionResult,
    ChatCompletionUsage,
    ChatMessage,
    ChatProvider,
    ChatStream,
    ChatStreamEvent,
    ChatStreamOptions,
    ToolCall,
} from "./types.js"

type GeminiPart = {
    text?: string
    functionCall?: {
        id?: string
        name?: string
        args?: Record<string, unknown>
    }
    functionResponse?: {
        name: string
        response: Record<string, unknown>
    }
    /** Gemini 3 requires this back on the same functionCall part in the next request. */
    thoughtSignature?: string
}

function thoughtSignatureOf(call: ToolCall): string | undefined {
    const gemini = call.providerMetadata?.gemini
    if (gemini && typeof gemini === "object" && !Array.isArray(gemini)) {
        const signature = (gemini as Record<string, unknown>).thoughtSignature
        if (typeof signature === "string" && signature.length > 0) {
            return signature
        }
    }
    return undefined
}

type GeminiContent = {
    role?: string
    parts?: GeminiPart[]
}

type GeminiGenerateResponse = {
    candidates?: Array<{
        content?: GeminiContent
    }>
    usageMetadata?: {
        promptTokenCount?: number
        candidatesTokenCount?: number
        thoughtsTokenCount?: number
        totalTokenCount?: number
    }
    error?: {
        message?: string
        status?: string
    }
}

function mapMessages(messages: ChatMessage[]) {
    const systemParts: string[] = []
    const contents: Array<{ role: "user" | "model"; parts: GeminiPart[] }> = []
    let previousWasTool = false

    for (const message of messages) {
        if (message.role === "system") {
            systemParts.push(message.content)
            previousWasTool = false
            continue
        }

        if (message.role === "tool") {
            const part: GeminiPart = {
                functionResponse: {
                    name: message.name,
                    response: { result: message.content },
                },
            }
            const last = contents[contents.length - 1]
            // Gemini expects all responses to one model turn's calls in a single user turn.
            if (previousWasTool && last) {
                last.parts.push(part)
            } else {
                contents.push({ role: "user", parts: [part] })
            }
            previousWasTool = true
            continue
        }

        previousWasTool = false

        if (message.role === "assistant") {
            const parts: GeminiPart[] = []
            if (message.content.length > 0) {
                parts.push({ text: message.content })
            }
            for (const call of message.toolCalls ?? []) {
                const thoughtSignature = thoughtSignatureOf(call)
                parts.push({
                    functionCall: { name: call.name, args: call.arguments },
                    ...(thoughtSignature ? { thoughtSignature } : {}),
                })
            }
            contents.push({ role: "model", parts })
            continue
        }

        contents.push({ role: "user", parts: [{ text: message.content }] })
    }

    return {
        systemInstruction:
            systemParts.length > 0
                ? { parts: [{ text: systemParts.join("\n\n") }] }
                : undefined,
        contents,
    }
}

function partsText(parts: GeminiPart[]): string {
    return parts
        .map((part) => part.text)
        .filter((text): text is string => typeof text === "string" && text.length > 0)
        .join("")
}

/**
 * Complete function calls in these parts. Gemini may omit ids, so the gateway assigns
 * call_${index} counting from firstIndex; callers send that id back with the tool result.
 */
function partsToolCalls(parts: GeminiPart[], firstIndex: number): ToolCall[] {
    const calls: ToolCall[] = []
    for (const part of parts) {
        const call = part.functionCall
        if (!call?.name) {
            continue
        }
        const index = firstIndex + calls.length
        calls.push({
            id: call.id || `call_${index}`,
            name: call.name,
            arguments:
                call.args && typeof call.args === "object" && !Array.isArray(call.args)
                    ? call.args
                    : {},
            ...(part.thoughtSignature
                ? { providerMetadata: { gemini: { thoughtSignature: part.thoughtSignature } } }
                : {}),
        })
    }
    return calls
}

function mapUsage(meta: GeminiGenerateResponse["usageMetadata"]): ChatCompletionUsage | null {
    if (
        !meta ||
        typeof meta.promptTokenCount !== "number" ||
        typeof meta.candidatesTokenCount !== "number"
    ) {
        return null
    }
    // Gemini bills thinking tokens as output but reports them outside candidatesTokenCount.
    const outputTokens =
        meta.candidatesTokenCount +
        (typeof meta.thoughtsTokenCount === "number" ? meta.thoughtsTokenCount : 0)
    return {
        inputTokens: meta.promptTokenCount,
        outputTokens,
        totalTokens:
            typeof meta.totalTokenCount === "number"
                ? meta.totalTokenCount
                : meta.promptTokenCount + outputTokens,
    }
}

function buildRequestBody(input: ChatCompletionInput): Record<string, unknown> {
    const { systemInstruction, contents } = mapMessages(input.messages)

    if (contents.length === 0) {
        throw new AppError(
            400,
            "VALIDATION_ERROR",
            "At least one user or assistant message is required",
        )
    }

    const body: Record<string, unknown> = { contents }
    if (systemInstruction) {
        body.systemInstruction = systemInstruction
    }
    if (input.tools && input.tools.length > 0) {
        body.tools = [
            {
                functionDeclarations: input.tools.map((tool) => ({
                    name: tool.name,
                    ...(tool.description !== undefined ? { description: tool.description } : {}),
                    // parametersJsonSchema accepts standard JSON Schema; parameters only an OpenAPI subset.
                    parametersJsonSchema: tool.parameters,
                })),
            },
        ]
    }

    const generationConfig: Record<string, unknown> = {}
    if (input.temperature !== undefined) {
        generationConfig.temperature = input.temperature
    }
    if (input.maxTokens !== undefined) {
        generationConfig.maxOutputTokens = input.maxTokens
    }
    if (input.reasoning !== undefined) {
        generationConfig.thinkingConfig = { thinkingLevel: input.reasoning }
    }
    if (Object.keys(generationConfig).length > 0) {
        body.generationConfig = generationConfig
    }

    return body
}

function requireApiKey() {
    if (!env.GEMINI_API_KEY) {
        throw new AppError(503, "PROVIDER_MISCONFIGURED", "GEMINI_API_KEY is not configured")
    }
    return env.GEMINI_API_KEY
}

class GeminiChatProvider implements ChatProvider {
    async complete(input: ChatCompletionInput): Promise<ChatCompletionResult> {
        const apiKey = requireApiKey()
        const baseUrl = input.baseUrl.replace(/\/$/, "")
        const url = `${baseUrl}/models/${encodeURIComponent(input.model)}:generateContent`
        const body = buildRequestBody(input)

        let response: Response
        try {
            response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": apiKey,
                },
                body: JSON.stringify(body),
            })
        } catch (err) {
            const message = err instanceof Error ? err.message : "Upstream request failed"
            throw new AppError(502, "UPSTREAM_ERROR", message)
        }

        const raw = (await response.json().catch(() => null)) as GeminiGenerateResponse | null

        if (!response.ok) {
            const message = raw?.error?.message ?? `Gemini request failed (${response.status})`
            throw new AppError(
                response.status >= 400 && response.status < 500 ? 400 : 502,
                "UPSTREAM_ERROR",
                message,
            )
        }

        const parts = raw?.candidates?.[0]?.content?.parts ?? []
        const content = partsText(parts)
        const toolCalls = partsToolCalls(parts, 0)

        if (!content && toolCalls.length === 0) {
            throw new AppError(502, "UPSTREAM_ERROR", "Gemini returned no assistant message")
        }

        return {
            message: {
                role: "assistant",
                content,
                ...(toolCalls.length > 0 ? { toolCalls } : {}),
            },
            usage: mapUsage(raw?.usageMetadata),
            raw,
        }
    }

    async openStream(input: ChatCompletionInput, options?: ChatStreamOptions): Promise<ChatStream> {
        const apiKey = requireApiKey()
        const baseUrl = input.baseUrl.replace(/\/$/, "")
        const url = `${baseUrl}/models/${encodeURIComponent(input.model)}:streamGenerateContent?alt=sse`
        const body = buildRequestBody(input)

        let response: Response
        try {
            response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "text/event-stream",
                    "x-goog-api-key": apiKey,
                },
                body: JSON.stringify(body),
                ...(options?.signal ? { signal: options.signal } : {}),
            })
        } catch (err) {
            if (options?.signal?.aborted) {
                throw new AppError(499, "CLIENT_CLOSED", "Client disconnected")
            }
            const message = err instanceof Error ? err.message : "Upstream request failed"
            throw new AppError(502, "UPSTREAM_ERROR", message)
        }

        if (!response.ok) {
            const raw = (await response.json().catch(() => null)) as GeminiGenerateResponse | null
            const message = raw?.error?.message ?? `Gemini request failed (${response.status})`
            throw new AppError(
                response.status >= 400 && response.status < 500 ? 400 : 502,
                "UPSTREAM_ERROR",
                message,
            )
        }

        if (!response.body) {
            throw new AppError(502, "UPSTREAM_ERROR", "Gemini returned an empty stream body")
        }

        const rawChunks: unknown[] = []
        const responseBody = response.body
        const signal = options?.signal

        const stream: ChatStream = {
            rawChunks,
            async *[Symbol.asyncIterator](): AsyncGenerator<ChatStreamEvent> {
                let toolCallCount = 0
                for await (const payload of parseSseDataPayloads(responseBody, signal)) {
                    let chunk: GeminiGenerateResponse
                    try {
                        chunk = JSON.parse(payload) as GeminiGenerateResponse
                    } catch {
                        continue
                    }

                    rawChunks.push(chunk)

                    if (chunk.error?.message) {
                        throw new AppError(502, "UPSTREAM_ERROR", chunk.error.message)
                    }

                    const parts = chunk.candidates?.[0]?.content?.parts ?? []
                    const content = partsText(parts)

                    if (content.length > 0) {
                        yield { type: "delta", content }
                    }

                    for (const call of partsToolCalls(parts, toolCallCount)) {
                        toolCallCount += 1
                        yield { type: "tool_call", ...call }
                    }

                    const usage = mapUsage(chunk.usageMetadata)
                    if (usage) {
                        yield { type: "usage", usage }
                    }
                }
            },
        }

        return stream
    }
}

export default new GeminiChatProvider()
