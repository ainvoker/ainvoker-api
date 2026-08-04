import { z } from "zod"

export const projectIdParamsSchema = z.object({
    projectId: z.string().min(1),
})

export const aiRequestParamsSchema = z.object({
    projectId: z.string().min(1),
    requestId: z.string().min(1),
})

export const listAiRequestsQuerySchema = z.object({
    status: z.enum(["PENDING", "SUCCESS", "FAILED", "REJECTED"]).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).default(0),
})
