import { z } from "zod"

export const createCheckoutSessionSchema = z.object({
    plan: z.literal("pro"),
    returnUrl: z.string().url().optional(),
})

export const orgSubscriptionResponseSchema = z.object({
    planName: z.string(),
    status: z.string(),
    billingMode: z.string(),
    tokenLimit: z.number(),
    requestLimit: z.number(),
    pendingPlanName: z.string().nullable().optional(),
})

export type OrgSubscriptionResponse = z.infer<typeof orgSubscriptionResponseSchema>
