import { z } from "zod"

export const MAX_TOOLS = 32

const TOOL_NAME_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_-]{0,63}$/

const jsonObjectSchema = z.record(z.string(), z.unknown())

export const toolDefinitionSchema = z.object({
    name: z.string().regex(TOOL_NAME_PATTERN, "tool name must match ^[a-zA-Z_][a-zA-Z0-9_-]{0,63}$"),
    description: z.string().optional(),
    parameters: jsonObjectSchema,
})

export const toolCallSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    arguments: jsonObjectSchema,
    providerMetadata: jsonObjectSchema.optional(),
})

const systemMessageSchema = z.object({
    role: z.literal("system"),
    content: z.string().min(1),
})

const userMessageSchema = z.object({
    role: z.literal("user"),
    content: z.string().min(1),
})

const assistantMessageSchema = z
    .object({
        role: z.literal("assistant"),
        content: z.string(),
        toolCalls: z.array(toolCallSchema).optional(),
    })
    .superRefine((message, ctx) => {
        const hasToolCalls = (message.toolCalls?.length ?? 0) > 0
        if (message.content.length === 0 && !hasToolCalls) {
            ctx.addIssue({
                code: "custom",
                path: ["content"],
                message: "assistant content may be empty only when toolCalls is non-empty",
            })
        }
    })

const toolMessageSchema = z.object({
    role: z.literal("tool"),
    toolCallId: z.string().min(1),
    name: z.string().min(1),
    content: z.string().min(1),
})

export const chatMessageSchema = z.discriminatedUnion("role", [
    systemMessageSchema,
    userMessageSchema,
    assistantMessageSchema,
    toolMessageSchema,
])

export const textChatSchema = z.object({
    model: z
        .string()
        .trim()
        .min(1)
        .refine(
            (value) => !value.includes("/") || /^[^/]+\/[^/]+$/.test(value),
            'model must be "provider/model" or a bare model name',
        ),
    messages: z.array(chatMessageSchema).min(1),
    tools: z
        .array(toolDefinitionSchema)
        .max(MAX_TOOLS)
        .superRefine((tools, ctx) => {
            const seen = new Set<string>()
            tools.forEach((tool, index) => {
                if (seen.has(tool.name)) {
                    ctx.addIssue({
                        code: "custom",
                        path: [index, "name"],
                        message: `duplicate tool name "${tool.name}"`,
                    })
                }
                seen.add(tool.name)
            })
        })
        .optional(),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().int().positive().optional(),
    reasoning: z.enum(["minimal", "low", "medium", "high"]).optional(),
})

export type TextChatBody = z.infer<typeof textChatSchema>

export function parseModelSlug(model: string): { providerName: string; modelName: string } {
    const slash = model.indexOf("/")
    if (slash <= 0 || slash === model.length - 1) {
        throw new Error('model must be "provider/model"')
    }
    return {
        providerName: model.slice(0, slash),
        modelName: model.slice(slash + 1),
    }
}

export function isModelSlug(model: string): boolean {
    const slash = model.indexOf("/")
    return slash > 0 && slash < model.length - 1 && !model.includes("/", slash + 1)
}
