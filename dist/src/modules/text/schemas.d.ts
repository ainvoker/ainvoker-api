import { z } from "zod";
export declare const chatMessageSchema: z.ZodObject<{
    role: z.ZodEnum<{
        system: "system";
        user: "user";
        assistant: "assistant";
    }>;
    content: z.ZodString;
}, z.core.$strip>;
export declare const textChatSchema: z.ZodObject<{
    model: z.ZodString;
    messages: z.ZodArray<z.ZodObject<{
        role: z.ZodEnum<{
            system: "system";
            user: "user";
            assistant: "assistant";
        }>;
        content: z.ZodString;
    }, z.core.$strip>>;
    temperature: z.ZodOptional<z.ZodNumber>;
    maxTokens: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export type TextChatBody = z.infer<typeof textChatSchema>;
export declare function parseModelSlug(model: string): {
    providerName: string;
    modelName: string;
};
//# sourceMappingURL=schemas.d.ts.map