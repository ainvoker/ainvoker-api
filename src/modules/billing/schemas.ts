import { z } from "zod"

export const createCheckoutSessionSchema = z.object({
    plan: z.literal("pro"),
    returnUrl: z.string().url().optional(),
})

export const paymentMethodSchema = z
    .object({
        type: z.string().nullable(),
        brand: z.string().nullable(),
        last4: z.string().nullable(),
        hasToken: z.boolean(),
    })
    .nullable()

export const orgSubscriptionResponseSchema = z.object({
    planName: z.string(),
    status: z.string(),
    billingMode: z.string(),
    tokenLimit: z.number(),
    requestLimit: z.number(),
    pendingPlanName: z.string().nullable().optional(),
    expiresAt: z.string().nullable().optional(),
    renewsAt: z.string().nullable().optional(),
    cancelAtPeriodEnd: z.boolean().optional(),
    canceledAt: z.string().nullable().optional(),
    paymentMethod: paymentMethodSchema.optional(),
})

export const invoiceItemSchema = z.object({
    id: z.string(),
    date: z.string(),
    description: z.string(),
    status: z.enum(["issued", "paid", "failed", "refunded"]),
    amount: z.string(),
    currency: z.string(),
    receiptUrl: z.string().nullable(),
    referenceNumber: z.string(),
})

export const cancelSubscriptionResponseSchema = z.object({
    cancelAtPeriodEnd: z.boolean(),
    expiresAt: z.string().nullable(),
    alreadyCanceled: z.boolean().optional(),
})

export type OrgSubscriptionResponse = z.infer<typeof orgSubscriptionResponseSchema>
export type InvoiceItem = z.infer<typeof invoiceItemSchema>
