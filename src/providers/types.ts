export type ToolDefinition = {
    name: string
    description?: string | undefined
    /** JSON Schema object for the tool arguments. */
    parameters: Record<string, unknown>
}

export type ToolCall = {
    id: string
    name: string
    arguments: Record<string, unknown>
    /**
     * Opaque vendor data the caller must send back unchanged with this call,
     * e.g. { gemini: { thoughtSignature } }.
     */
    providerMetadata?: Record<string, unknown> | undefined
}

export type AssistantMessage = {
    role: "assistant"
    /** Empty only when toolCalls is non-empty. */
    content: string
    toolCalls?: ToolCall[] | undefined
}

export type ToolResultMessage = {
    role: "tool"
    toolCallId: string
    name: string
    content: string
}

export type ChatMessage =
    | { role: "system" | "user"; content: string }
    | AssistantMessage
    | ToolResultMessage

export type ChatCompletionInput = {
    /** Vendor model id, e.g. "gpt-4o-mini" */
    model: string
    messages: ChatMessage[]
    tools?: ToolDefinition[]
    temperature?: number
    maxTokens?: number
    /** Thinking depth for models that support it; ignored by models that do not. */
    reasoning?: "minimal" | "low" | "medium" | "high"
    /** From AIProvider.baseUrl */
    baseUrl: string
}

export type ChatCompletionUsage = {
    inputTokens: number
    outputTokens: number
    totalTokens: number
}

export type ChatCompletionResult = {
    message: AssistantMessage
    usage: ChatCompletionUsage | null
    raw: unknown
}

export type ChatStreamDeltaEvent = {
    type: "delta"
    content: string
}

export type ChatStreamUsageEvent = {
    type: "usage"
    usage: ChatCompletionUsage
}

/** One complete tool call; argument fragments are never yielded. */
export type ChatStreamToolCallEvent = {
    type: "tool_call"
} & ToolCall

export type ChatStreamEvent = ChatStreamDeltaEvent | ChatStreamToolCallEvent | ChatStreamUsageEvent

export type ChatStreamOptions = {
    signal?: AbortSignal
}

/**
 * Upstream stream after a successful HTTP response.
 * Yields assistant text deltas, complete tool calls, and optional usage; does not yield terminal events.
 */
export type ChatStream = AsyncIterable<ChatStreamEvent> & {
    /** Collected vendor chunks for AIRequest.responsePayload.raw */
    readonly rawChunks: unknown[]
}

export interface ChatProvider {
    complete(input: ChatCompletionInput): Promise<ChatCompletionResult>
    /**
     * Open a vendor stream. Throws AppError on misconfig, network failure, or non-2xx
     * before returning. The iterable yields delta/tool_call/usage only.
     */
    openStream(input: ChatCompletionInput, options?: ChatStreamOptions): Promise<ChatStream>
}

export type ImageSize = "1024x1024" | "1024x1536" | "1536x1024" | "auto"
export type ImageQuality = "low" | "medium" | "high" | "xhigh" | "max" | "auto"
export type ImageOutputFormat = "png" | "jpeg" | "webp"

export type ImageGenerationInput = {
    /** Vendor model id, e.g. "gpt-image-2.5-flare" */
    model: string
    prompt: string
    n: number
    size?: ImageSize
    quality?: ImageQuality
    outputFormat?: ImageOutputFormat
    /** From AIProvider.baseUrl */
    baseUrl: string
}

export type GeneratedImage = {
    base64: string
    mimeType: string
    revisedPrompt?: string | undefined
}

export type ImageGenerationResult = {
    images: GeneratedImage[]
    usage: ChatCompletionUsage | null
    /** Vendor response with image bytes removed, for AIRequest.responsePayload.raw */
    raw: unknown
}

export interface ImageProvider {
    generate(input: ImageGenerationInput): Promise<ImageGenerationResult>
}
