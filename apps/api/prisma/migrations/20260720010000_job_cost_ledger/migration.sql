-- CreateEnum
CREATE TYPE "JobCostKind" AS ENUM ('MATERIAL_PURCHASE', 'MATERIAL_USED', 'LABOR', 'TRAVEL', 'EXTERNAL_SERVICE', 'FEE', 'OTHER');

-- CreateEnum
CREATE TYPE "JobCostUnit" AS ENUM ('PIECE', 'HOUR', 'KILOMETER', 'KG', 'LITER', 'METER', 'SQUARE_METER', 'CUBIC_METER', 'FLAT_RATE', 'OTHER');

-- CreateTable
CREATE TABLE "JobCostLine" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "itemId" TEXT,
    "kind" "JobCostKind" NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(14,3) NOT NULL,
    "unit" "JobCostUnit" NOT NULL,
    "unitCost" DECIMAL(14,2),
    "totalCost" DECIMAL(14,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'EUR',
    "taxRate" DECIMAL(5,2),
    "costDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vendorName" TEXT,
    "receiptReference" TEXT,
    "notes" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "updatedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobCostLine_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "JobCostLine_quantity_positive" CHECK ("quantity" > 0),
    CONSTRAINT "JobCostLine_unit_cost_nonnegative" CHECK ("unitCost" IS NULL OR "unitCost" >= 0),
    CONSTRAINT "JobCostLine_total_cost_nonnegative" CHECK ("totalCost" >= 0),
    CONSTRAINT "JobCostLine_tax_rate_range" CHECK ("taxRate" IS NULL OR ("taxRate" >= 0 AND "taxRate" <= 100)),
    CONSTRAINT "JobCostLine_currency_format" CHECK ("currency" ~ '^[A-Z]{3}$')
);

-- CreateIndex
CREATE INDEX "JobCostLine_companyId_jobId_costDate_idx" ON "JobCostLine"("companyId", "jobId", "costDate");

-- CreateIndex
CREATE INDEX "JobCostLine_companyId_kind_idx" ON "JobCostLine"("companyId", "kind");

-- CreateIndex
CREATE INDEX "JobCostLine_itemId_idx" ON "JobCostLine"("itemId");

-- CreateIndex
CREATE INDEX "JobCostLine_createdByUserId_idx" ON "JobCostLine"("createdByUserId");

-- CreateIndex
CREATE INDEX "JobCostLine_updatedByUserId_idx" ON "JobCostLine"("updatedByUserId");

-- AddForeignKey
ALTER TABLE "JobCostLine" ADD CONSTRAINT "JobCostLine_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobCostLine" ADD CONSTRAINT "JobCostLine_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobCostLine" ADD CONSTRAINT "JobCostLine_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobCostLine" ADD CONSTRAINT "JobCostLine_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobCostLine" ADD CONSTRAINT "JobCostLine_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
