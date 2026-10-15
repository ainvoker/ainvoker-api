import { z } from "zod"

const catalogStatusSchema = z.enum(["ACTIVE", "INACTIVE", "DEPRECATED"])
const routableModelTypeSchema = z.enum(["TEXT", "IMAGE"])

export const adminModelParamsSchema = z.object({
    modelId: z.coerce.number().int().positive(),
})

export const listAdminModelsQuerySchema = z.object({
    type: routableModelTypeSchema.optional(),
    status: catalogStatusSchema.optional(),
    providerId: z.coerce.number().int().positive().optional(),
})

/** Models are defined in code; admin may change availability and plan access only. */
export const updateAdminModelSchema = z
    .object({
        status: catalogStatusSchema.optional(),
        planTier: z.enum(["ECONOMY", "PREMIUM"]).optional(),
        freeEligible: z.boolean().optional(),
    })
    .refine(
        (body) =>
            body.status !== undefined ||
            body.planTier !== undefined ||
            body.freeEligible !== undefined,
        "Provide at least one of status, planTier, or freeEligible",
    )

export type UpdateAdminModelInput = z.infer<typeof updateAdminModelSchema>
export type ListAdminModelsQuery = z.infer<typeof listAdminModelsQuerySchema>
