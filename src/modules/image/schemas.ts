import { z } from "zod"

export const MAX_IMAGES_PER_REQUEST = 4

export const imageGenerateSchema = z.object({
    model: z
        .string()
        .trim()
        .min(1)
        .refine(
            (value) => !value.includes("/") || /^[^/]+\/[^/]+$/.test(value),
            'model must be "provider/model" or a bare model name',
        ),
    prompt: z.string().trim().min(1).max(32000),
    n: z.number().int().min(1).max(MAX_IMAGES_PER_REQUEST).optional(),
    size: z.enum(["1024x1024", "1024x1536", "1536x1024", "auto"]).optional(),
    quality: z.enum(["low", "medium", "high", "xhigh", "max", "auto"]).optional(),
    outputFormat: z.enum(["png", "jpeg", "webp"]).optional(),
})

export type ImageGenerateBody = z.infer<typeof imageGenerateSchema>
