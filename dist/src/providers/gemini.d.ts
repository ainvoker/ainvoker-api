import type { ChatCompletionInput, ChatCompletionResult, ChatProvider } from "./types.js";
declare class GeminiChatProvider implements ChatProvider {
    complete(input: ChatCompletionInput): Promise<ChatCompletionResult>;
}
declare const _default: GeminiChatProvider;
export default _default;
//# sourceMappingURL=gemini.d.ts.map