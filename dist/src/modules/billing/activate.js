import { Prisma } from "../../generated/prisma/client.js";
import prismaClient from "../../platform/prisma.js";
import { ensureBillingCatalog, getPlanByName, PLAN_NAMES } from "./catalog.js";
export async function activateProSubscription(input) {
    await ensureBillingCatalog();
    const proPlan = await getPlanByName(PLAN_NAMES.pro);
    const existingTx = await prismaClient.transaction.findUnique({
        where: { referenceNumber: input.paymentReference },
    });
    if (existingTx) {
        return { alreadyProcessed: true };
    }
    await prismaClient.$transaction(async (tx) => {
        const pending = await tx.subscription.findFirst({
            where: {
                organizationId: input.organizationId,
                planId: proPlan.id,
                status: "PENDING",
            },
            orderBy: { createdAt: "desc" },
        });
        if (!pending) {
            const activePro = await tx.subscription.findFirst({
                where: {
                    organizationId: input.organizationId,
                    planId: proPlan.id,
                    status: "ACTIVE",
                },
            });
            if (activePro) {
                return;
            }
            // No pending or active Pro — ignore (stale webhook)
            return;
        }
        await tx.subscription.updateMany({
            where: {
                organizationId: input.organizationId,
                status: "ACTIVE",
                id: { not: pending.id },
            },
            data: { status: "CANCELED" },
        });
        await tx.subscription.update({
            where: { id: pending.id },
            data: {
                status: "ACTIVE",
                startedAt: new Date(),
            },
        });
        await tx.transaction.create({
            data: {
                subscriptionId: pending.id,
                amount: new Prisma.Decimal(input.amountPhp).div(100),
                paymentMethod: "xendit",
                referenceNumber: input.paymentReference,
                paymentStatus: "SUCCEEDED",
            },
        });
        if (input.paymentTokenId) {
            await tx.organization.update({
                where: { id: input.organizationId },
                data: { xenditPaymentTokenId: input.paymentTokenId },
            });
        }
    });
    return { activated: true };
}
//# sourceMappingURL=activate.js.map