-- AlterEnum
CREATE TYPE "PlanBillingMode" AS ENUM ('FIXED_MONTHLY', 'METERED');

-- AlterTable
ALTER TABLE "AIModel" ADD COLUMN "freeEligible" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Plan" ADD COLUMN "billingMode" "PlanBillingMode" NOT NULL DEFAULT 'FIXED_MONTHLY';
