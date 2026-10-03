-- CreateEnum
CREATE TYPE "WorksheetReviewActionType" AS ENUM ('CREATE_FOLLOW_UP_JOB');

-- CreateEnum
CREATE TYPE "WorksheetReviewActionStatus" AS ENUM ('COMPLETED');

-- CreateTable
CREATE TABLE "WorksheetReviewAction" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "sourceSheetId" TEXT NOT NULL,
    "sourceRowId" TEXT NOT NULL,
    "type" "WorksheetReviewActionType" NOT NULL,
    "status" "WorksheetReviewActionStatus" NOT NULL DEFAULT 'COMPLETED',
    "idempotencyKey" VARCHAR(191) NOT NULL,
    "requestFingerprint" VARCHAR(64) NOT NULL,
    "sourceSnapshot" JSONB NOT NULL,
    "destinationJobId" TEXT NOT NULL,
    "destinationJobReference" TEXT NOT NULL,
    "destinationJobTitle" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorksheetReviewAction_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "WorksheetReviewAction_idempotency_key_nonblank_check" CHECK (btrim("idempotencyKey") <> ''),
    CONSTRAINT "WorksheetReviewAction_request_fingerprint_check" CHECK ("requestFingerprint" ~ '^[a-f0-9]{64}$'),
    CONSTRAINT "WorksheetReviewAction_destination_snapshot_check" CHECK (
      btrim("destinationJobReference") <> '' AND btrim("destinationJobTitle") <> ''
    )
);

-- CreateIndex
CREATE UNIQUE INDEX "WorksheetReviewAction_companyId_sourceRowId_type_key" ON "WorksheetReviewAction"("companyId", "sourceRowId", "type");
CREATE UNIQUE INDEX "WorksheetReviewAction_companyId_idempotencyKey_key" ON "WorksheetReviewAction"("companyId", "idempotencyKey");
CREATE INDEX "WorksheetReviewAction_companyId_sourceSheetId_createdAt_idx" ON "WorksheetReviewAction"("companyId", "sourceSheetId", "createdAt");
CREATE INDEX "WorksheetReviewAction_destinationJobId_idx" ON "WorksheetReviewAction"("destinationJobId");
CREATE INDEX "WorksheetReviewAction_createdByUserId_idx" ON "WorksheetReviewAction"("createdByUserId");

-- AddForeignKey
ALTER TABLE "WorksheetReviewAction" ADD CONSTRAINT "WorksheetReviewAction_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorksheetReviewAction" ADD CONSTRAINT "WorksheetReviewAction_sourceSheetId_fkey" FOREIGN KEY ("sourceSheetId") REFERENCES "WorkdaySheet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WorksheetReviewAction" ADD CONSTRAINT "WorksheetReviewAction_sourceRowId_fkey" FOREIGN KEY ("sourceRowId") REFERENCES "WorkdaySheetRow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WorksheetReviewAction" ADD CONSTRAINT "WorksheetReviewAction_destinationJobId_fkey" FOREIGN KEY ("destinationJobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WorksheetReviewAction" ADD CONSTRAINT "WorksheetReviewAction_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
