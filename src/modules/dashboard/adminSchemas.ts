import { z } from "zod"
import { currentFinancePeriod } from "../finance/period.js"

const periodSchema = z
    .string()
    .regex(/^\d{4}-\d{2}$/, "period must be YYYY-MM")
    .describe("UTC calendar month as YYYY-MM")

export const adminDashboardQuerySchema = z
    .object({
        period: periodSchema.optional(),
        months: z.coerce.number().int().min(2).max(12).optional(),
    })
    .transform((q) => ({
        period: q.period ?? currentFinancePeriod(),
        months: q.months ?? 6,
    }))

export type AdminDashboardQuery = z.infer<typeof adminDashboardQuerySchema>
