import { z } from "zod"

export const profileFieldsSchema = z.object({
    firstName: z.string().trim().min(1).max(100).nullable().optional(),
    lastName: z.string().trim().min(1).max(100).nullable().optional(),
    profilePicture: z.string().trim().url().max(2000).nullable().optional(),
})

export type ProfileFields = z.infer<typeof profileFieldsSchema>

export const updateProfileSchema = profileFieldsSchema.refine(
    (body) => Object.keys(body).length > 0,
    {
        message: "At least one field is required",
    },
)

/** Optional profile seed on first bootstrap (create User + Personal org). */
export const bootstrapProfileSchema = profileFieldsSchema
