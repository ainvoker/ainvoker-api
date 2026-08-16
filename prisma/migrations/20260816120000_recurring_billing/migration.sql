-- AlterTable
ALTER TABLE "Organization" ADD COLUMN "paymentMethodType" TEXT,
ADD COLUMN "paymentMethodBrand" TEXT,
ADD COLUMN "paymentMethodLast4" TEXT;

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "canceledAt" TIMESTAMP(3),
ADD COLUMN "xenditRecurringPlanId" TEXT;

-- CreateIndex
CREATE INDEX "Subscription_xenditRecurringPlanId_idx" ON "Subscription"("xenditRecurringPlanId");

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN "description" TEXT,
ADD COLUMN "receiptUrl" TEXT;
