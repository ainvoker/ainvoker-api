import { z } from "zod";
export const chatMessageSchema = z.object({
    role: z.enum(["system", "user", "assistant"]),
    content: z.string().min(1),
});
export const textChatSchema = z.object({
    model: z
        .string()
        .trim()
        .min(1)
        .regex(/^[^/]+\/[^/]+$/, 'model must be "provider/model" (e.g. openai/gpt-4o-mini)'),
    messages: z.array(chatMessageSchema).min(1),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().int().positive().optional(),
});
export function parseModelSlug(model) {
    const slash = model.indexOf("/");
    if (slash <= 0 || slash === model.length - 1) {
        throw new Error('model must be "provider/model"');
    }
    return {
        providerName: model.slice(0, slash),
        modelName: model.slice(slash + 1),
    };
}
//# sourceMappingURL=schemas.js.map