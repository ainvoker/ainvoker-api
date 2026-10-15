-- CreateEnum
CREATE TYPE "ModelPlanTier" AS ENUM ('ECONOMY', 'PREMIUM');

-- AlterTable User
ALTER TABLE "User" ADD COLUMN "freeQuotaUnitsUsed" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "freeQuotaUnitsLimit" INTEGER NOT NULL DEFAULT 50000;

-- AlterTable Organization
ALTER TABLE "Organization" ADD COLUMN "scaleWalletBalanceCentavos" INTEGER NOT NULL DEFAULT 0;

-- AlterTable AIModel: provider prices + plan tier
ALTER TABLE "AIModel" ADD COLUMN "providerInputPrice" DECIMAL(12,6);
ALTER TABLE "AIModel" ADD COLUMN "providerOutputPrice" DECIMAL(12,6);
ALTER TABLE "AIModel" ADD COLUMN "planTier" "ModelPlanTier" NOT NULL DEFAULT 'PREMIUM';

UPDATE "AIModel" SET
  "providerInputPrice" = "inputPrice",
  "providerOutputPrice" = "outputPrice",
  "planTier" = CASE WHEN "freeEligible" = true THEN 'ECONOMY'::"ModelPlanTier" ELSE 'PREMIUM'::"ModelPlanTier" END;

ALTER TABLE "AIModel" ALTER COLUMN "providerInputPrice" SET NOT NULL;
ALTER TABLE "AIModel" ALTER COLUMN "providerOutputPrice" SET NOT NULL;

-- Fix gpt-4o-mini provider list prices (USD per 1M)
UPDATE "AIModel" SET
  "providerInputPrice" = 0.15,
  "providerOutputPrice" = 0.60
WHERE "name" = 'gpt-4o-mini';

-- AlterTable AIRequest
ALTER TABLE "AIRequest" ADD COLUMN "quotaTokens" INTEGER;

-- PlatformBusinessSettings
CREATE TABLE "PlatformBusinessSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "economyMarkupMultiplier" DECIMAL(8,4) NOT NULL DEFAULT 1.2,
    "premiumMarkupMultiplier" DECIMAL(8,4) NOT NULL DEFAULT 1.35,
    "imageMarkupMultiplier" DECIMAL(8,4) NOT NULL DEFAULT 1.4,
    "usdToPhpRate" DECIMAL(12,4) NOT NULL DEFAULT 58,
    "quotaReferenceModelId" INTEGER,
    "scaleAdvanceCentavos" INTEGER NOT NULL DEFAULT 49900,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformBusinessSettings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "PlatformBusinessSettings" ("id", "updatedAt") VALUES (1, CURRENT_TIMESTAMP);
