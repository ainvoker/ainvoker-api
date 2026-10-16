import { z } from "zod"
import { currentFinancePeriod } from "../finance/period.js"

const periodSchema = z
    .string()
    .regex(/^\d{4}-\d{2}$/, "period must be YYYY-MM")
    .describe("UTC calendar month as YYYY-MM")

export const adminUsagePeriodQuerySchema = z
    .object({
        period: periodSchema.optional(),
    })
    .transform((q) => ({
        period: q.period ?? currentFinancePeriod(),
    }))

export const listAdminAiRequestsQuerySchema = z.object({
    q: z.string().trim().min(1).max(200).optional(),
    status: z.enum(["PENDING", "SUCCESS", "FAILED", "REJECTED"]).optional(),
    organizationId: z.string().min(1).optional(),
    period: periodSchema.optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).default(0),
})

export const adminAiRequestParamsSchema = z.object({
    requestId: z.string().min(1),
})

export type AdminUsagePeriodQuery = z.infer<typeof adminUsagePeriodQuerySchema>
export type ListAdminAiRequestsQuery = z.infer<typeof listAdminAiRequestsQuerySchema>
