-- CreateEnum
CREATE TYPE "JobReportType" AS ENUM ('GENERAL', 'WORKER_FINDING', 'WORK_COMPLETION', 'INCIDENT_REPORT', 'FOLLOW_UP_REQUEST');

-- AlterEnum
ALTER TYPE "ReportReviewStatus" ADD VALUE 'PENDING_REVIEW';
ALTER TYPE "ReportReviewStatus" ADD VALUE 'APPROVED';
ALTER TYPE "ReportReviewStatus" ADD VALUE 'NEEDS_REVISION';
ALTER TYPE "ReportReviewStatus" ADD VALUE 'REJECTED';

-- AlterTable
ALTER TABLE "JobReport"
ADD COLUMN "reviewedByUserId" TEXT,
ADD COLUMN "type" "JobReportType" NOT NULL DEFAULT 'GENERAL',
ADD COLUMN "findingSummary" TEXT,
ADD COLUMN "workPerformed" TEXT,
ADD COLUMN "workStillNeeded" TEXT,
ADD COLUMN "followUpRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "followUpNotes" TEXT,
ADD COLUMN "reviewedAt" TIMESTAMP(3),
ADD COLUMN "reviewNotes" TEXT;

-- CreateIndex
CREATE INDEX "JobReport_companyId_reviewStatus_createdAt_idx" ON "JobReport"("companyId", "reviewStatus", "createdAt");

-- CreateIndex
CREATE INDEX "JobReport_reviewedByUserId_idx" ON "JobReport"("reviewedByUserId");

-- AddForeignKey
ALTER TABLE "JobReport" ADD CONSTRAINT "JobReport_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
