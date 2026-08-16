import { z } from "zod"

export const createAllowedOriginSchema = z.object({
    origin: z.string().trim().min(1).max(500),
})

export const allowedOriginParamsSchema = z.object({
    projectId: z.string().min(1),
    originId: z.string().min(1),
})
