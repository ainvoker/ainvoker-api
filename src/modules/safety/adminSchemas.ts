import { z } from "zod"

const apiKeyStatusSchema = z.enum(["ACTIVE", "REVOKED", "EXPIRED"])
const projectStatusFilterSchema = z.enum(["ACTIVE", "ARCHIVED", "DISABLED"])
const adminProjectStatusSchema = z.enum(["ACTIVE", "DISABLED"])

export const listAdminApiKeysQuerySchema = z.object({
    q: z.string().trim().min(1).max(200).optional(),
    status: apiKeyStatusSchema.optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).default(0),
})

export const adminApiKeyParamsSchema = z.object({
    keyId: z.string().min(1),
})

export const listAdminProjectsQuerySchema = z.object({
    q: z.string().trim().min(1).max(200).optional(),
    status: projectStatusFilterSchema.optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).default(0),
})

export const adminProjectParamsSchema = z.object({
    projectId: z.string().min(1),
})

export const updateAdminProjectSchema = z.object({
    status: adminProjectStatusSchema,
})

export type ListAdminApiKeysQuery = z.infer<typeof listAdminApiKeysQuerySchema>
export type ListAdminProjectsQuery = z.infer<typeof listAdminProjectsQuerySchema>
export type UpdateAdminProjectInput = z.infer<typeof updateAdminProjectSchema>
