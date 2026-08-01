-- CreateEnum
CREATE TYPE "OrganizationStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');

-- CreateEnum
CREATE TYPE "ProjectEnvironment" AS ENUM ('DEVELOPMENT', 'STAGING', 'PRODUCTION');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'DISABLED');

-- CreateEnum
CREATE TYPE "ApiKeyStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "CatalogStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DEPRECATED');

-- CreateEnum
CREATE TYPE "AIModelType" AS ENUM ('TEXT', 'IMAGE', 'AUDIO', 'MULTIMODAL', 'EMBEDDING', 'OTHER');

-- CreateEnum
CREATE TYPE "AIServiceType" AS ENUM ('TEXT', 'IMAGE', 'ACTION');

-- CreateEnum
CREATE TYPE "AIRequestStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ActionInvocationStatus" AS ENUM ('REQUESTED', 'REPORTED_SUCCESS', 'REPORTED_FAILURE');

-- CreateEnum
CREATE TYPE "WebhookEvent" AS ENUM ('REQUEST_FAILED', 'RATE_LIMIT_EXCEEDED', 'USAGE_ALERT');

-- CreateEnum
CREATE TYPE "WebhookStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED');

-- DropForeignKey
ALTER TABLE "AIRequest" DROP CONSTRAINT "AIRequest_applicationId_fkey";

-- DropForeignKey
ALTER TABLE "AIRequest" DROP CONSTRAINT "AIRequest_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "Action" DROP CONSTRAINT "Action_applicationId_fkey";

-- DropForeignKey
ALTER TABLE "ActionInvocation" DROP CONSTRAINT "ActionInvocation_requestId_fkey";

-- DropForeignKey
ALTER TABLE "ActivityLog" DROP CONSTRAINT "ActivityLog_userId_fkey";

-- DropForeignKey
ALTER TABLE "ApiKey" DROP CONSTRAINT "ApiKey_applicationId_fkey";

-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_userId_fkey";

-- DropForeignKey
ALTER TABLE "RateLimit" DROP CONSTRAINT "RateLimit_applicationId_fkey";

-- DropForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_userId_fkey";

-- DropForeignKey
ALTER TABLE "UsageAnalytics" DROP CONSTRAINT "UsageAnalytics_applicationId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_roleId_fkey";

-- DropForeignKey
ALTER TABLE "Webhook" DROP CONSTRAINT "Webhook_applicationId_fkey";

-- DropIndex
DROP INDEX "ApiKey_apiKey_key";

-- AlterTable
ALTER TABLE "AIModel" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" "AIModelType" NOT NULL,
ALTER COLUMN "inputPrice" SET DATA TYPE DECIMAL(12,6),
ALTER COLUMN "outputPrice" SET DATA TYPE DECIMAL(12,6),
DROP COLUMN "status",
ADD COLUMN     "status" "CatalogStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "AIProvider" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "CatalogStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "AIRequest" DROP COLUMN "applicationId",
DROP COLUMN "prompt",
DROP COLUMN "response",
DROP COLUMN "serviceId",
ADD COLUMN     "projectId" TEXT NOT NULL,
ADD COLUMN     "requestPayload" JSONB NOT NULL,
ADD COLUMN     "responsePayload" JSONB,
ADD COLUMN     "serviceType" "AIServiceType" NOT NULL,
ALTER COLUMN "inputTokens" DROP NOT NULL,
ALTER COLUMN "outputTokens" DROP NOT NULL,
ALTER COLUMN "totalTokens" DROP NOT NULL,
ALTER COLUMN "latency" DROP NOT NULL,
DROP COLUMN "requestStatus",
ADD COLUMN     "requestStatus" "AIRequestStatus" NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "requestCost" DROP NOT NULL,
ALTER COLUMN "requestCost" SET DATA TYPE DECIMAL(12,6);

-- AlterTable
ALTER TABLE "Action" DROP COLUMN "applicationId",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "projectId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "ActionInvocation" DROP COLUMN "executionStatus",
ADD COLUMN     "executionStatus" "ActionInvocationStatus" NOT NULL;

-- AlterTable
ALTER TABLE "ApiKey" DROP COLUMN "apiKey",
DROP COLUMN "applicationId",
ADD COLUMN     "keyHash" TEXT NOT NULL,
ADD COLUMN     "keyPrefix" TEXT NOT NULL,
ADD COLUMN     "projectId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "ApiKeyStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "Plan" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "monthlyPrice" SET DATA TYPE DECIMAL(12,6);

-- AlterTable
ALTER TABLE "Subscription" DROP COLUMN "userId",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "organizationId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(12,6),
DROP COLUMN "paymentStatus",
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "UsageAnalytics" DROP COLUMN "applicationId",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "projectId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "totalRequests" SET DEFAULT 0,
ALTER COLUMN "successfulRequests" SET DEFAULT 0,
ALTER COLUMN "failedRequests" SET DEFAULT 0,
ALTER COLUMN "totalTokens" SET DEFAULT 0,
ALTER COLUMN "totalCost" SET DEFAULT 0,
ALTER COLUMN "totalCost" SET DATA TYPE DECIMAL(12,6);

-- AlterTable
ALTER TABLE "User" DROP COLUMN "roleId";

-- AlterTable
ALTER TABLE "Webhook" DROP COLUMN "applicationId",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "projectId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "event",
ADD COLUMN     "event" "WebhookEvent" NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "WebhookStatus" NOT NULL DEFAULT 'ACTIVE';

-- DropTable
DROP TABLE "AIService";

-- DropTable
DROP TABLE "Application";

-- DropTable
DROP TABLE "RateLimit";

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "OrganizationStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationMember" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "environment" "ProjectEnvironment" NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "OrganizationMember_userId_idx" ON "OrganizationMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMember_organizationId_userId_key" ON "OrganizationMember"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "Project_organizationId_idx" ON "Project"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Project_organizationId_name_key" ON "Project"("organizationId", "name");

-- CreateIndex
CREATE INDEX "AIModel_providerId_idx" ON "AIModel"("providerId");

-- CreateIndex
CREATE UNIQUE INDEX "AIModel_providerId_name_key" ON "AIModel"("providerId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "AIProvider_name_key" ON "AIProvider"("name");

-- CreateIndex
CREATE INDEX "AIRequest_projectId_idx" ON "AIRequest"("projectId");

-- CreateIndex
CREATE INDEX "AIRequest_apiKeyId_idx" ON "AIRequest"("apiKeyId");

-- CreateIndex
CREATE INDEX "AIRequest_createdAt_idx" ON "AIRequest"("createdAt");

-- CreateIndex
CREATE INDEX "Action_projectId_idx" ON "Action"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Action_projectId_name_key" ON "Action"("projectId", "name");

-- CreateIndex
CREATE INDEX "ActionInvocation_requestId_idx" ON "ActionInvocation"("requestId");

-- CreateIndex
CREATE INDEX "ActionInvocation_actionId_idx" ON "ActionInvocation"("actionId");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "ApiKey_projectId_idx" ON "ApiKey"("projectId");

-- CreateIndex
CREATE INDEX "Subscription_organizationId_idx" ON "Subscription"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_referenceNumber_key" ON "Transaction"("referenceNumber");

-- CreateIndex
CREATE INDEX "Transaction_subscriptionId_idx" ON "Transaction"("subscriptionId");

-- CreateIndex
CREATE INDEX "UsageAnalytics_projectId_idx" ON "UsageAnalytics"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "UsageAnalytics_projectId_month_year_key" ON "UsageAnalytics"("projectId", "month", "year");

-- CreateIndex
CREATE INDEX "Webhook_projectId_idx" ON "Webhook"("projectId");

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIRequest" ADD CONSTRAINT "AIRequest_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionInvocation" ADD CONSTRAINT "ActionInvocation_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "AIRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageAnalytics" ADD CONSTRAINT "UsageAnalytics_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Webhook" ADD CONSTRAINT "Webhook_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
