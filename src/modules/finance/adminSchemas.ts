import { z } from "zod"
import { currentFinancePeriod } from "./period.js"

const periodSchema = z
    .string()
    .regex(/^\d{4}-\d{2}$/, "period must be YYYY-MM")
    .describe("UTC calendar month as YYYY-MM")

export const expenseCategorySchema = z.enum([
    "INFRA",
    "PROCESSOR_FEES",
    "SOFTWARE",
    "PEOPLE",
    "OTHER",
])

export const financePeriodQuerySchema = z.object({
    period: periodSchema.optional(),
}).transform((q) => ({
    period: q.period ?? currentFinancePeriod(),
}))

export const listFinanceExpensesQuerySchema = z.object({
    period: periodSchema.optional(),
})

export const createFinanceExpenseSchema = z.object({
    category: expenseCategorySchema,
    amountPhp: z.number().finite().nonnegative(),
    period: periodSchema,
    description: z.string().trim().min(1).max(500),
    notes: z.string().trim().max(2000).optional().nullable(),
})

export const financeExpenseParamsSchema = z.object({
    expenseId: z.string().min(1),
})

export const updateFinanceExpenseSchema = z
    .object({
        category: expenseCategorySchema.optional(),
        amountPhp: z.number().finite().nonnegative().optional(),
        period: periodSchema.optional(),
        description: z.string().trim().min(1).max(500).optional(),
        notes: z.string().trim().max(2000).optional().nullable(),
    })
    .refine((body) => Object.keys(body).length > 0, { message: "At least one field is required" })

export const financeReconciliationUploadSchema = z.object({
    period: periodSchema,
    csvText: z.string().min(1).max(5_000_000),
    filename: z.string().trim().max(255).optional().nullable(),
})

export type FinancePeriodQuery = z.infer<typeof financePeriodQuerySchema>
export type ListFinanceExpensesQuery = z.infer<typeof listFinanceExpensesQuerySchema>
export type CreateFinanceExpenseInput = z.infer<typeof createFinanceExpenseSchema>
export type UpdateFinanceExpenseInput = z.infer<typeof updateFinanceExpenseSchema>
export type FinanceReconciliationUpload = z.infer<typeof financeReconciliationUploadSchema>
