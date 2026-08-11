export type ChatMessage = {
    role: "system" | "user" | "assistant";
    content: string;
};
export type ChatCompletionInput = {
    /** Vendor model id, e.g. "gpt-4o-mini" */
    model: string;
    messages: ChatMessage[];
    temperature?: number;
    maxTokens?: number;
    /** From AIProvider.baseUrl */
    baseUrl: string;
};
export type ChatCompletionUsage = {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
};
export type ChatCompletionResult = {
    message: ChatMessage;
    usage: ChatCompletionUsage | null;
    raw: unknown;
};
export interface ChatProvider {
    complete(input: ChatCompletionInput): Promise<ChatCompletionResult>;
}
//# sourceMappingURL=types.d.ts.map