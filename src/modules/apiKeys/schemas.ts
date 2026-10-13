import { z } from "zod"
import { apiKeyPermissionsSchema } from "./permissions.js"

export const createApiKeySchema = z.object({
    keyName: z.string().trim().min(1).max(100),
    permissions: apiKeyPermissionsSchema.optional(),
    expiresAt: z.coerce
        .date()
        .refine((date) => date.getTime() > Date.now(), "Expiry must be in the future")
        .optional(),
})

export const updateApiKeySchema = z.object({
    permissions: apiKeyPermissionsSchema.nullable(),
})

export const apiKeyParamsSchema = z.object({
    projectId: z.string().min(1),
    keyId: z.string().min(1),
})

export const projectIdParamsSchema = z.object({
    projectId: z.string().min(1),
})
