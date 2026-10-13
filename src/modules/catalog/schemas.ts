import { z } from "zod"

const catalogStatusSchema = z.enum(["ACTIVE", "INACTIVE", "DEPRECATED"])
const routableModelTypeSchema = z.enum(["TEXT", "IMAGE"])
/** USD per 1M tokens; stored as Decimal(12, 6). */
const priceSchema = z.number().nonnegative().max(999_999)

export const adminModelParamsSchema = z.object({
    modelId: z.coerce.number().int().positive(),
})

export const listAdminModelsQuerySchema = z.object({
    type: routableModelTypeSchema.optional(),
    status: catalogStatusSchema.optional(),
    providerId: z.coerce.number().int().positive().optional(),
})

export const createAdminModelSchema = z.object({
    providerId: z.number().int().positive(),
    name: z
        .string()
        .trim()
        .min(1)
        .max(200)
        .regex(/^[^\s/]+$/, "name must not contain spaces or slashes"),
    type: routableModelTypeSchema,
    contextWindow: z.number().int().positive(),
    inputPrice: priceSchema,
    outputPrice: priceSchema,
    status: catalogStatusSchema.default("ACTIVE"),
    freeEligible: z.boolean().default(false),
})

export const updateAdminModelSchema = z
    .object({
        contextWindow: z.number().int().positive().optional(),
        inputPrice: priceSchema.optional(),
        outputPrice: priceSchema.optional(),
        status: catalogStatusSchema.optional(),
        freeEligible: z.boolean().optional(),
    })
    .refine((body) => Object.keys(body).length > 0, {
        message: "At least one field is required",
    })

export type CreateAdminModelInput = z.infer<typeof createAdminModelSchema>
export type UpdateAdminModelInput = z.infer<typeof updateAdminModelSchema>
export type ListAdminModelsQuery = z.infer<typeof listAdminModelsQuerySchema>
