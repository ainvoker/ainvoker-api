import { z } from "zod"

const subscriptionStatusSchema = z.enum(["PENDING", "ACTIVE", "PAST_DUE", "CANCELED", "EXPIRED"])
const paymentStatusSchema = z.enum(["PENDING", "SUCCEEDED", "FAILED", "REFUNDED"])
const planNameSchema = z.enum(["free", "pro", "scale"])

export const listAdminSubscriptionsQuerySchema = z.object({
    q: z.string().trim().min(1).optional(),
    status: subscriptionStatusSchema.optional(),
    plan: planNameSchema.optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).default(0),
})

export const listAdminTransactionsQuerySchema = z.object({
    q: z.string().trim().min(1).optional(),
    paymentStatus: paymentStatusSchema.optional(),
    from: z.string().datetime({ offset: true }).optional(),
    to: z.string().datetime({ offset: true }).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).default(0),
})

export const adminSubscriptionParamsSchema = z.object({
    subscriptionId: z.string().min(1),
})

export const updateAdminSubscriptionSchema = z.discriminatedUnion("action", [
    z.object({
        action: z.literal("cancel"),
        atPeriodEnd: z.boolean().default(true),
    }),
    z.object({
        action: z.literal("grant_pro"),
        expiresAt: z.string().datetime({ offset: true }).optional(),
    }),
    z.object({
        action: z.literal("extend_pro"),
        days: z.number().int().min(1).max(365),
    }),
])

export type ListAdminSubscriptionsQuery = z.infer<typeof listAdminSubscriptionsQuerySchema>
export type ListAdminTransactionsQuery = z.infer<typeof listAdminTransactionsQuerySchema>
export type UpdateAdminSubscriptionInput = z.infer<typeof updateAdminSubscriptionSchema>
