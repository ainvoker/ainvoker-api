-- CreateEnum
CREATE TYPE "ApiKeyClientType" AS ENUM ('SERVER', 'BROWSER');

-- AlterTable
ALTER TABLE "ApiKey" ADD COLUMN     "clientType" "ApiKeyClientType" NOT NULL DEFAULT 'SERVER';
