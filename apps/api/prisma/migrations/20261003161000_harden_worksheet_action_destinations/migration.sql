-- Replace the type-specific destination check with explicit null guards.
-- PostgreSQL CHECK constraints accept UNKNOWN, so btrim(NULL) alone is not sufficient.
ALTER TABLE "WorksheetReviewAction"
DROP CONSTRAINT "WorksheetReviewAction_destination_type_check";

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
    AND "destinationCostDescription" IS NOT NULL
    AND btrim("destinationCostDescription") <> ''
    AND "destinationReportSummary" IS NULL
  )
  OR (
    "type" = 'CREATE_JOB_REPORT'
    AND "destinationJobCostLineId" IS NULL
    AND "destinationJobReportId" IS NOT NULL
    AND "destinationCostDescription" IS NULL
    AND "destinationReportSummary" IS NOT NULL
    AND btrim("destinationReportSummary") <> ''
  )
);
