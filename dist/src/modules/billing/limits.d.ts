import type { AIModel, Plan } from "../../../generated/prisma/client.js";
import { type PlanName } from "./catalog.js";
export type QuotaSnapshot = {
    planName: string;
    billingMode: Plan["billingMode"];
    requestLimit: number;
    requestsUsed: number;
    tokenLimit: number;
    tokensUsed: number;
    periodStart: Date;
};
export declare function getActiveSubscriptionWithPlan(organizationId: string): Promise<{
    plan: {
        billingMode: import("../../../generated/prisma/enums.js").PlanBillingMode;
        tokenLimit: number;
        requestLimit: number;
        name: string;
        description: string | null;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        monthlyPrice: import("@prisma/client-runtime-utils").Decimal;
    };
} & {
    expiresAt: Date | null;
    status: import("../../../generated/prisma/enums.js").SubscriptionStatus;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    organizationId: string;
    planId: number;
    startedAt: Date;
    xenditSessionId: string | null;
}>;
export declare function assertModelAllowedForPlan(plan: Pick<Plan, "name">, model: Pick<AIModel, "freeEligible" | "name">): void;
/**
 * Enforce monthly quotas for FIXED_MONTHLY plans.
 * For METERED, only enforce when requestLimit/tokenLimit are > 0 (safety ceilings).
 */
export declare function assertWithinPlanLimits(organizationId: string): Promise<QuotaSnapshot>;
export declare function isPlanName(name: string): name is PlanName;
//# sourceMappingURL=limits.d.ts.map