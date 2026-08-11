import { z } from "zod"

export const orgIdParamsSchema = z.object({
    orgId: z.string().min(1),
})

const slugSchema = z
    .string()
    .trim()
    .min(2)
    .max(64)
    .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug must be lowercase letters, numbers, and hyphens",
    )

export const createOrganizationSchema = z.object({
    name: z.string().trim().min(1).max(100),
    slug: slugSchema.optional(),
    /** Paid plan for the new org. Free is Personal-only and not allowed here. */
    plan: z.enum(["pro", "scale"]),
})
