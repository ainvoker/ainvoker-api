/** Framing tokens reserved per message (role and separators) on top of content. */
const MESSAGE_FRAME_TOKENS = 4

/**
 * Output tokens reserved when the caller omits maxTokens.
 * The same value is sent to the provider, so a completion cannot exceed the hold.
 */
export const DEFAULT_OUTPUT_TOKEN_HOLD = 8192

export type TextTokenHold = {
    inputTokens: number
    outputTokens: number
}

type HoldMessage = {
    content: string
    toolCalls?: { arguments: unknown }[] | undefined
}

/**
 * Upper bound used to reserve monthly token quota before the provider call.
 * BPE tokenizers emit at most one token per character, so content length is a ceiling.
 * Tool definitions and tool-call arguments are counted by their JSON length.
 */
export function estimateTextTokenHold(
    messages: HoldMessage[],
    maxTokens: number | undefined,
    tools?: unknown[],
): TextTokenHold {
    let inputTokens = 0
    for (const message of messages) {
        inputTokens += MESSAGE_FRAME_TOKENS + message.content.length
        for (const call of message.toolCalls ?? []) {
            inputTokens += JSON.stringify(call.arguments).length
        }
    }
    if (tools && tools.length > 0) {
        inputTokens += JSON.stringify(tools).length
    }

    return {
        inputTokens: Math.max(inputTokens, 1),
        outputTokens: maxTokens ?? DEFAULT_OUTPUT_TOKEN_HOLD,
    }
}
