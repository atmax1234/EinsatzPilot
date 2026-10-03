-- AlterEnum
ALTER TYPE "WorksheetReviewActionType" ADD VALUE 'CREATE_JOB_COST_LINE';
ALTER TYPE "WorksheetReviewActionType" ADD VALUE 'CREATE_JOB_REPORT';

-- AlterTable
ALTER TABLE "WorksheetReviewAction"
ADD COLUMN "destinationJobCostLineId" TEXT,
ADD COLUMN "destinationJobReportId" TEXT,
ADD COLUMN "destinationCostDescription" TEXT,
ADD COLUMN "destinationReportSummary" TEXT;

-- AddCheckConstraint
ALTER TABLE "WorksheetReviewAction"
ADD CONSTRAINT "WorksheetReviewAction_destination_type_check" CHECK (
  (
    "type" = 'CREATE_FOLLOW_UP_JOB'
    AND "destinationJobCostLineId" IS NULL
    AND "destinationJobReportId" IS NULL
    AND "destinationCostDescription" IS NULL
    AND "destinationReportSummary" IS NULL
  )
  OR (
    "type" = 'CREATE_JOB_COST_LINE'
    AND "destinationJobCostLineId" IS NOT NULL
    AND "destinationJobReportId" IS NULL
    AND btrim("destinationCostDescription") <> ''
    AND "destinationReportSummary" IS NULL
  )
  OR (
    "type" = 'CREATE_JOB_REPORT'
    AND "destinationJobCostLineId" IS NULL
    AND "destinationJobReportId" IS NOT NULL
    AND "destinationCostDescription" IS NULL
    AND btrim("destinationReportSummary") <> ''
  )
);

-- CreateIndex
CREATE INDEX "WorksheetReviewAction_destinationJobCostLineId_idx" ON "WorksheetReviewAction"("destinationJobCostLineId");
CREATE INDEX "WorksheetReviewAction_destinationJobReportId_idx" ON "WorksheetReviewAction"("destinationJobReportId");

-- AddForeignKey
ALTER TABLE "WorksheetReviewAction" ADD CONSTRAINT "WorksheetReviewAction_destinationJobCostLineId_fkey" FOREIGN KEY ("destinationJobCostLineId") REFERENCES "JobCostLine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WorksheetReviewAction" ADD CONSTRAINT "WorksheetReviewAction_destinationJobReportId_fkey" FOREIGN KEY ("destinationJobReportId") REFERENCES "JobReport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
