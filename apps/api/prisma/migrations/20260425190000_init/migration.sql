-- CreateEnum
CREATE TYPE "BudgetKind" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "BudgetNature" AS ENUM ('FIXED', 'VARIABLE');

-- CreateTable
CREATE TABLE "BudgetCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "kind" "BudgetKind" NOT NULL,
    "nature" "BudgetNature" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfiguredYear" (
    "year" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguredYear_pkey" PRIMARY KEY ("year")
);

-- CreateTable
CREATE TABLE "AnnualBudget" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "plannedAmount" DECIMAL(12,2) NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnnualBudget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyConsumption" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "actualAmount" DECIMAL(12,2) NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyConsumption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BudgetCategory_name_key" ON "BudgetCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AnnualBudget_year_categoryId_key" ON "AnnualBudget"("year", "categoryId");

-- CreateIndex
CREATE INDEX "AnnualBudget_year_idx" ON "AnnualBudget"("year");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyConsumption_year_month_categoryId_key" ON "MonthlyConsumption"("year", "month", "categoryId");

-- CreateIndex
CREATE INDEX "MonthlyConsumption_year_month_idx" ON "MonthlyConsumption"("year", "month");

-- AddForeignKey
ALTER TABLE "AnnualBudget"
ADD CONSTRAINT "AnnualBudget_categoryId_fkey"
FOREIGN KEY ("categoryId") REFERENCES "BudgetCategory"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyConsumption"
ADD CONSTRAINT "MonthlyConsumption_categoryId_fkey"
FOREIGN KEY ("categoryId") REFERENCES "BudgetCategory"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
