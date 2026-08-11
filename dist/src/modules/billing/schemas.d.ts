import { z } from "zod";
export declare const createCheckoutSessionSchema: z.ZodObject<{
    plan: z.ZodLiteral<"pro">;
    returnUrl: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const orgSubscriptionResponseSchema: z.ZodObject<{
    planName: z.ZodString;
    status: z.ZodString;
    billingMode: z.ZodString;
    tokenLimit: z.ZodNumber;
    requestLimit: z.ZodNumber;
    pendingPlanName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
export type OrgSubscriptionResponse = z.infer<typeof orgSubscriptionResponseSchema>;
//# sourceMappingURL=schemas.d.ts.map