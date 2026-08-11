declare class BillingService {
    getOrganizationSubscription(organizationId: string): Promise<{
        planName: string;
        status: import("../../../generated/prisma/enums.js").SubscriptionStatus;
        billingMode: import("../../../generated/prisma/enums.js").PlanBillingMode;
        tokenLimit: number;
        requestLimit: number;
        pendingPlanName: string | null;
    }>;
    createProCheckoutSession(input: {
        organizationId: string;
        userId: string;
        roleName: string;
        returnUrl: string;
    }): Promise<{
        componentsSdkKey: string;
        sessionId: string;
        expiresAt: string | null;
    }>;
    handleXenditWebhook(payload: unknown, callbackToken: string | undefined): Promise<{
        handled: boolean;
        skipped?: never;
        activated?: never;
        ignored?: never;
    } | {
        handled: boolean;
        skipped: boolean;
        activated?: never;
        ignored?: never;
    } | {
        handled: boolean;
        activated: boolean;
        skipped?: never;
        ignored?: never;
    } | {
        handled: boolean;
        ignored: string;
        skipped?: never;
        activated?: never;
    }>;
}
declare const _default: BillingService;
export default _default;
//# sourceMappingURL=service.d.ts.map