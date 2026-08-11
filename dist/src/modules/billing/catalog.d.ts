export declare const PLAN_NAMES: {
    readonly free: "free";
    readonly pro: "pro";
    readonly scale: "scale";
};
export type PlanName = (typeof PLAN_NAMES)[keyof typeof PLAN_NAMES];
/**
 * Idempotent seed for Free / Pro / Scale plans.
 * Safe to call frequently; runs upsert work at most once per process.
 */
export declare function ensureBillingCatalog(): Promise<void>;
export declare function getPlanByName(name: PlanName): Promise<{
    billingMode: import("../../generated/prisma/enums.js").PlanBillingMode;
    tokenLimit: number;
    requestLimit: number;
    name: string;
    description: string | null;
    id: number;
    createdAt: Date;
    updatedAt: Date;
    monthlyPrice: import("@prisma/client-runtime-utils").Decimal;
}>;
/** Pro checkout amount in PHP smallest unit (centavos), from env. */
export declare function getProCheckoutAmountPhp(): number;
//# sourceMappingURL=catalog.d.ts.map