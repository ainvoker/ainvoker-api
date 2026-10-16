-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('INFRA', 'PROCESSOR_FEES', 'SOFTWARE', 'PEOPLE', 'OTHER');

-- CreateEnum
CREATE TYPE "ReconciliationKind" AS ENUM ('XENDIT', 'PROVIDER');

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "amountPhp" DECIMAL(12,2) NOT NULL,
    "period" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceReconciliationRun" (
    "id" TEXT NOT NULL,
    "kind" "ReconciliationKind" NOT NULL,
    "period" TEXT NOT NULL,
    "filename" TEXT,
    "rowCount" INTEGER NOT NULL,
    "matchedCount" INTEGER NOT NULL,
    "driftCount" INTEGER NOT NULL,
    "summaryJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinanceReconciliationRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Expense_period_idx" ON "Expense"("period");

-- CreateIndex
CREATE INDEX "FinanceReconciliationRun_kind_period_createdAt_idx" ON "FinanceReconciliationRun"("kind", "period", "createdAt");
