-- CreateEnum
CREATE TYPE "CustomerReportType" AS ENUM (
    'JOB_COMPLETION',
    'INCIDENT',
    'DAMAGE_REPORT',
    'MAINTENANCE',
    'OBJECT_STATUS',
    'COST_OVERVIEW',
    'OTHER'
);

-- CreateEnum
CREATE TYPE "CustomerReportStatus" AS ENUM (
    'DRAFT',
    'READY_FOR_REVIEW',
    'APPROVED',
    'ARCHIVED'
);

-- CreateTable
CREATE TABLE "CustomerReportSnapshot" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "reportNumber" TEXT NOT NULL,
    "jobId" TEXT,
    "customerId" TEXT,
    "addressId" TEXT,
    "objectId" TEXT,
    "objectAreaId" TEXT,
    "type" "CustomerReportType" NOT NULL,
    "status" "CustomerReportStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "issueSummary" TEXT,
    "findingSummary" TEXT,
    "workPerformedSummary" TEXT,
    "workStillNeededSummary" TEXT,
    "followUpSummary" TEXT,
    "costSummaryText" TEXT,
    "internalNotes" TEXT,
    "snapshotCustomerName" TEXT NOT NULL,
    "snapshotAddressLabel" TEXT,
    "snapshotAddressText" TEXT NOT NULL,
    "snapshotObjectName" TEXT,
    "snapshotObjectAreaName" TEXT,
    "snapshotJobReference" TEXT NOT NULL,
    "snapshotJobTitle" TEXT NOT NULL,
    "snapshotCostGrandTotal" DECIMAL(14,2),
    "snapshotCostCurrency" VARCHAR(3),
    "snapshotCostBreakdown" JSONB,
    "snapshotSourceData" JSONB NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "approvedByUserId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerReportSnapshot_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CustomerReportSnapshot_period_range_check" CHECK (
      "periodStart" IS NULL OR "periodEnd" IS NULL OR "periodEnd" >= "periodStart"
    ),
    CONSTRAINT "CustomerReportSnapshot_cost_snapshot_check" CHECK (
      ("snapshotCostGrandTotal" IS NULL AND "snapshotCostCurrency" IS NULL) OR
      ("snapshotCostGrandTotal" IS NOT NULL AND "snapshotCostGrandTotal" >= 0 AND "snapshotCostCurrency" IS NOT NULL)
    ),
    CONSTRAINT "CustomerReportSnapshot_currency_format_check" CHECK (
      "snapshotCostCurrency" IS NULL OR "snapshotCostCurrency" ~ '^[A-Z]{3}$'
    ),
    CONSTRAINT "CustomerReportSnapshot_source_schema_check" CHECK (
      jsonb_typeof("snapshotSourceData") = 'object' AND
      "snapshotSourceData" ->> 'schemaVersion' = '1'
    ),
    CONSTRAINT "CustomerReportSnapshot_cost_schema_check" CHECK (
      "snapshotCostBreakdown" IS NULL OR
      (jsonb_typeof("snapshotCostBreakdown") = 'object' AND
       "snapshotCostBreakdown" ->> 'schemaVersion' = '1')
    ),
    CONSTRAINT "CustomerReportSnapshot_approval_pair_check" CHECK (
      ("approvedByUserId" IS NULL AND "approvedAt" IS NULL) OR
      ("approvedByUserId" IS NOT NULL AND "approvedAt" IS NOT NULL)
    ),
    CONSTRAINT "CustomerReportSnapshot_approved_status_check" CHECK (
      ("status" IN ('DRAFT', 'READY_FOR_REVIEW') AND "approvedByUserId" IS NULL AND "approvedAt" IS NULL) OR
      ("status" = 'APPROVED' AND "approvedByUserId" IS NOT NULL AND "approvedAt" IS NOT NULL) OR
      "status" = 'ARCHIVED'
    ),
    CONSTRAINT "CustomerReportSnapshot_required_text_check" CHECK (
      btrim("reportNumber") <> '' AND
      btrim("title") <> '' AND
      btrim("recipientName") <> '' AND
      btrim("snapshotCustomerName") <> '' AND
      btrim("snapshotAddressText") <> '' AND
      btrim("snapshotJobReference") <> '' AND
      btrim("snapshotJobTitle") <> ''
    )
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomerReportSnapshot_companyId_reportNumber_key"
ON "CustomerReportSnapshot"("companyId", "reportNumber");

-- CreateIndex
CREATE INDEX "CustomerReportSnapshot_companyId_status_createdAt_idx"
ON "CustomerReportSnapshot"("companyId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "CustomerReportSnapshot_companyId_type_createdAt_idx"
ON "CustomerReportSnapshot"("companyId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "CustomerReportSnapshot_companyId_jobId_createdAt_idx"
ON "CustomerReportSnapshot"("companyId", "jobId", "createdAt");

-- CreateIndex
CREATE INDEX "CustomerReportSnapshot_companyId_customerId_idx"
ON "CustomerReportSnapshot"("companyId", "customerId");

-- CreateIndex
CREATE INDEX "CustomerReportSnapshot_companyId_addressId_idx"
ON "CustomerReportSnapshot"("companyId", "addressId");

-- CreateIndex
CREATE INDEX "CustomerReportSnapshot_companyId_objectId_idx"
ON "CustomerReportSnapshot"("companyId", "objectId");

-- CreateIndex
CREATE INDEX "CustomerReportSnapshot_companyId_objectAreaId_idx"
ON "CustomerReportSnapshot"("companyId", "objectAreaId");

-- CreateIndex
CREATE INDEX "CustomerReportSnapshot_createdByUserId_idx"
ON "CustomerReportSnapshot"("createdByUserId");

-- CreateIndex
CREATE INDEX "CustomerReportSnapshot_approvedByUserId_idx"
ON "CustomerReportSnapshot"("approvedByUserId");

-- AddForeignKey
ALTER TABLE "CustomerReportSnapshot"
ADD CONSTRAINT "CustomerReportSnapshot_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerReportSnapshot"
ADD CONSTRAINT "CustomerReportSnapshot_jobId_fkey"
FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerReportSnapshot"
ADD CONSTRAINT "CustomerReportSnapshot_customerId_fkey"
FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerReportSnapshot"
ADD CONSTRAINT "CustomerReportSnapshot_addressId_fkey"
FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerReportSnapshot"
ADD CONSTRAINT "CustomerReportSnapshot_objectId_fkey"
FOREIGN KEY ("objectId") REFERENCES "Object"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerReportSnapshot"
ADD CONSTRAINT "CustomerReportSnapshot_objectAreaId_fkey"
FOREIGN KEY ("objectAreaId") REFERENCES "ObjectArea"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerReportSnapshot"
ADD CONSTRAINT "CustomerReportSnapshot_createdByUserId_fkey"
FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerReportSnapshot"
ADD CONSTRAINT "CustomerReportSnapshot_approvedByUserId_fkey"
FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
