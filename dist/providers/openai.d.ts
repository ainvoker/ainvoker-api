import type { ChatCompletionInput, ChatCompletionResult, ChatProvider } from "./types.js";
declare class OpenAIChatProvider implements ChatProvider {
    complete(input: ChatCompletionInput): Promise<ChatCompletionResult>;
}
declare const _default: OpenAIChatProvider;
export default _default;
//# sourceMappingURL=openai.d.ts.map