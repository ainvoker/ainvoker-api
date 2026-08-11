import { Prisma } from "../../generated/prisma/client.js";
import env from "../../config/env.js";
import prismaClient from "../../platform/prisma.js";
export const PLAN_NAMES = {
    free: "free",
    pro: "pro",
    scale: "scale",
};
const PLAN_SEEDS = [
    {
        name: PLAN_NAMES.free,
        monthlyPrice: new Prisma.Decimal(0),
        tokenLimit: 50_000,
        requestLimit: 300,
        billingMode: "FIXED_MONTHLY",
        description: "Personal workspace only; cheap models; hard monthly caps",
    },
    {
        name: PLAN_NAMES.pro,
        monthlyPrice: new Prisma.Decimal(19),
        tokenLimit: 2_000_000,
        requestLimit: 5_000,
        billingMode: "FIXED_MONTHLY",
        description: "Fixed monthly plan with included limits; unlimited paid orgs",
    },
    {
        name: PLAN_NAMES.scale,
        monthlyPrice: new Prisma.Decimal(0),
        tokenLimit: 0,
        requestLimit: 0,
        billingMode: "METERED",
        description: "Custom metered pricing; unlimited paid orgs; optional safety ceilings",
    },
];
let ensurePromise = null;
/**
 * Idempotent seed for Free / Pro / Scale plans.
 * Safe to call frequently; runs upsert work at most once per process.
 */
export async function ensureBillingCatalog() {
    if (!ensurePromise) {
        ensurePromise = seedBillingCatalog().catch((err) => {
            ensurePromise = null;
            throw err;
        });
    }
    await ensurePromise;
}
async function seedBillingCatalog() {
    for (const plan of PLAN_SEEDS) {
        await prismaClient.plan.upsert({
            where: { name: plan.name },
            create: { ...plan },
            update: {
                monthlyPrice: plan.monthlyPrice,
                tokenLimit: plan.tokenLimit,
                requestLimit: plan.requestLimit,
                billingMode: plan.billingMode,
                description: plan.description,
            },
        });
    }
}
export async function getPlanByName(name) {
    await ensureBillingCatalog();
    return prismaClient.plan.findUniqueOrThrow({ where: { name } });
}
/** Pro checkout amount in PHP smallest unit (centavos), from env. */
export function getProCheckoutAmountPhp() {
    return env.XENDIT_PRO_AMOUNT;
}
//# sourceMappingURL=catalog.js.map