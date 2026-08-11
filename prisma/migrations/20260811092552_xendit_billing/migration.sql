-- AlterEnum
ALTER TYPE "SubscriptionStatus" ADD VALUE 'PENDING';

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "xenditCustomerReference" TEXT,
ADD COLUMN     "xenditPaymentTokenId" TEXT;

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "xenditSessionId" TEXT;
