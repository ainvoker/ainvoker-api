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
    ToolDefinition,
} from "./types.js"

type OpenAIToolCall = {
    id?: string
    type?: string
    function?: {
        name?: string
        arguments?: string
    }
}

type OpenAIToolCallDelta = OpenAIToolCall & {
    index?: number
}

type OpenAIChatResponse = {
    choices?: Array<{
        message?: {
            role?: string
            content?: string | null
            tool_calls?: OpenAIToolCall[]
        }
        delta?: {
            content?: string | null
            tool_calls?: OpenAIToolCallDelta[]
        }
        finish_reason?: string | null
    }>
    usage?: {
        prompt_tokens?: number
        completion_tokens?: number
        total_tokens?: number
    }
    error?: {
        message?: string
    }
}

function mapUsage(usage: OpenAIChatResponse["usage"]): ChatCompletionUsage | null {
    if (
        !usage ||
        typeof usage.prompt_tokens !== "number" ||
        typeof usage.completion_tokens !== "number"
    ) {
        return null
    }
    return {
        inputTokens: usage.prompt_tokens,
        outputTokens: usage.completion_tokens,
        totalTokens:
            typeof usage.total_tokens === "number"
                ? usage.total_tokens
                : usage.prompt_tokens + usage.completion_tokens,
    }
}

function mapMessages(messages: ChatMessage[]): Array<Record<string, unknown>> {
    return messages.map((message) => {
        if (message.role === "tool") {
            return { role: "tool", tool_call_id: message.toolCallId, content: message.content }
        }
        if (message.role === "assistant" && message.toolCalls && message.toolCalls.length > 0) {
            return {
                role: "assistant",
                content: message.content,
                tool_calls: message.toolCalls.map((call) => ({
                    id: call.id,
                    type: "function",
                    function: { name: call.name, arguments: JSON.stringify(call.arguments) },
                })),
            }
        }
        return { role: message.role, content: message.content }
    })
}

function mapTools(tools: ToolDefinition[]) {
    return tools.map((tool) => ({
        type: "function",
        function: {
            name: tool.name,
            ...(tool.description !== undefined ? { description: tool.description } : {}),
            parameters: tool.parameters,
        },
    }))
}

function parseToolArguments(raw: string | undefined): Record<string, unknown> {
    if (raw === undefined || raw.trim() === "") {
        return {}
    }
    let parsed: unknown
    try {
        parsed = JSON.parse(raw)
    } catch {
        throw new AppError(502, "UPSTREAM_ERROR", "OpenAI returned invalid tool call arguments")
    }
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new AppError(502, "UPSTREAM_ERROR", "OpenAI returned invalid tool call arguments")
    }
    return parsed as Record<string, unknown>
}

function toToolCall(id: string | undefined, name: string | undefined, args: string | undefined): ToolCall {
    if (!id || !name) {
        throw new AppError(502, "UPSTREAM_ERROR", "OpenAI returned an incomplete tool call")
    }
    return { id, name, arguments: parseToolArguments(args) }
}

function buildRequestBody(input: ChatCompletionInput, stream: boolean): Record<string, unknown> {
    const body: Record<string, unknown> = {
        model: input.model,
        messages: mapMessages(input.messages),
    }
    if (input.tools && input.tools.length > 0) {
        body.tools = mapTools(input.tools)
    }
    if (input.temperature !== undefined) {
        body.temperature = input.temperature
    }
    if (input.maxTokens !== undefined) {
        body.max_tokens = input.maxTokens
    }
    if (stream) {
        body.stream = true
        body.stream_options = { include_usage: true }
    }
    return body
}

function requireApiKey() {
    if (!env.OPENAI_API_KEY) {
        throw new AppError(503, "PROVIDER_MISCONFIGURED", "OPENAI_API_KEY is not configured")
    }
    return env.OPENAI_API_KEY
}

class OpenAIChatProvider implements ChatProvider {
    async complete(input: ChatCompletionInput): Promise<ChatCompletionResult> {
        const apiKey = requireApiKey()
        const baseUrl = input.baseUrl.replace(/\/$/, "")
        const url = `${baseUrl}/chat/completions`

        let response: Response
        try {
            response = await fetch(url, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(buildRequestBody(input, false)),
            })
        } catch (err) {
            const message = err instanceof Error ? err.message : "Upstream request failed"
            throw new AppError(502, "UPSTREAM_ERROR", message)
        }

        const raw = (await response.json().catch(() => null)) as OpenAIChatResponse | null

        if (!response.ok) {
            const message = raw?.error?.message ?? `OpenAI request failed (${response.status})`
            throw new AppError(
                response.status >= 400 && response.status < 500 ? 400 : 502,
                "UPSTREAM_ERROR",
                message,
            )
        }

        const choice = raw?.choices?.[0]?.message
        const toolCalls = (choice?.tool_calls ?? []).map((call) =>
            toToolCall(call.id, call.function?.name, call.function?.arguments),
        )
        const content = choice?.content
        if (toolCalls.length === 0 && typeof content !== "string") {
            throw new AppError(502, "UPSTREAM_ERROR", "OpenAI returned no assistant message")
        }

        return {
            message: {
                role: "assistant",
                content: typeof content === "string" ? content : "",
                ...(toolCalls.length > 0 ? { toolCalls } : {}),
            },
            usage: mapUsage(raw?.usage),
            raw,
        }
    }

    async openStream(input: ChatCompletionInput, options?: ChatStreamOptions): Promise<ChatStream> {
        const apiKey = requireApiKey()
        const baseUrl = input.baseUrl.replace(/\/$/, "")
        const url = `${baseUrl}/chat/completions`

        let response: Response
        try {
            response = await fetch(url, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                    Accept: "text/event-stream",
                },
                body: JSON.stringify(buildRequestBody(input, true)),
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
            const raw = (await response.json().catch(() => null)) as OpenAIChatResponse | null
            const message = raw?.error?.message ?? `OpenAI request failed (${response.status})`
            throw new AppError(
                response.status >= 400 && response.status < 500 ? 400 : 502,
                "UPSTREAM_ERROR",
                message,
            )
        }

        if (!response.body) {
            throw new AppError(502, "UPSTREAM_ERROR", "OpenAI returned an empty stream body")
        }

        const rawChunks: unknown[] = []
        const body = response.body
        const signal = options?.signal

        const stream: ChatStream = {
            rawChunks,
            async *[Symbol.asyncIterator](): AsyncGenerator<ChatStreamEvent> {
                const pending = new Map<number, { id?: string; name?: string; args: string }>()

                function* flushPending(belowIndex = Number.POSITIVE_INFINITY): Generator<ChatStreamEvent> {
                    const ready = [...pending.keys()].filter((i) => i < belowIndex).sort((a, b) => a - b)
                    for (const index of ready) {
                        const call = pending.get(index)!
                        pending.delete(index)
                        yield { type: "tool_call", ...toToolCall(call.id, call.name, call.args) }
                    }
                }

                for await (const payload of parseSseDataPayloads(body, signal)) {
                    if (payload === "[DONE]") {
                        break
                    }

                    let chunk: OpenAIChatResponse
                    try {
                        chunk = JSON.parse(payload) as OpenAIChatResponse
                    } catch {
                        continue
                    }

                    rawChunks.push(chunk)

                    if (chunk.error?.message) {
                        throw new AppError(502, "UPSTREAM_ERROR", chunk.error.message)
                    }

                    const choice = chunk.choices?.[0]
                    const delta = choice?.delta?.content
                    if (typeof delta === "string" && delta.length > 0) {
                        yield { type: "delta", content: delta }
                    }

                    for (const fragment of choice?.delta?.tool_calls ?? []) {
                        const index = fragment.index ?? 0
                        // A call is complete once the vendor moves on to a later index.
                        yield* flushPending(index)
                        const call = pending.get(index) ?? { args: "" }
                        if (fragment.id) call.id = fragment.id
                        if (fragment.function?.name) call.name = fragment.function.name
                        if (fragment.function?.arguments) call.args += fragment.function.arguments
                        pending.set(index, call)
                    }

                    if (choice?.finish_reason) {
                        yield* flushPending()
                    }

                    const usage = mapUsage(chunk.usage)
                    if (usage) {
                        yield { type: "usage", usage }
                    }
                }

                yield* flushPending()
            },
        }

        return stream
    }
}

export default new OpenAIChatProvider()
