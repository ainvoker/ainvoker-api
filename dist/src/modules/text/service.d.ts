import { type QuotaSnapshot } from "../billing/limits.js";
import type { ChatMessage } from "../../providers/types.js";
import type { ApiKeyContext } from "../../types/express.js";
import { type TextChatBody } from "./schemas.js";
export type TextChatResult = {
    id: string;
    model: string;
    message: ChatMessage;
    usage: {
        inputTokens: number;
        outputTokens: number;
        totalTokens: number;
    } | null;
    quota: QuotaSnapshot;
};
declare class TextService {
    chat(apiKeyContext: ApiKeyContext, body: TextChatBody): Promise<TextChatResult>;
}
declare const _default: TextService;
export default _default;
//# sourceMappingURL=service.d.ts.map