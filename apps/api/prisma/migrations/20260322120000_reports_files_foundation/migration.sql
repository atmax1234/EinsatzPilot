-- CreateEnum
CREATE TYPE "ReportReviewStatus" AS ENUM ('SUBMITTED');

-- CreateEnum
CREATE TYPE "AttachmentKind" AS ENUM ('PHOTO', 'FILE');

-- CreateTable
CREATE TABLE "JobReport" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "teamId" TEXT,
    "authorUserId" TEXT,
    "summary" TEXT NOT NULL,
    "details" TEXT,
    "reviewStatus" "ReportReviewStatus" NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobAttachment" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "reportId" TEXT,
    "teamId" TEXT,
    "uploaderUserId" TEXT,
    "kind" "AttachmentKind" NOT NULL,
    "storagePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobReport_companyId_idx" ON "JobReport"("companyId");

-- CreateIndex
CREATE INDEX "JobReport_jobId_createdAt_idx" ON "JobReport"("jobId", "createdAt");

-- CreateIndex
CREATE INDEX "JobReport_teamId_idx" ON "JobReport"("teamId");

-- CreateIndex
CREATE INDEX "JobReport_authorUserId_idx" ON "JobReport"("authorUserId");

-- CreateIndex
CREATE INDEX "JobAttachment_companyId_idx" ON "JobAttachment"("companyId");

-- CreateIndex
CREATE INDEX "JobAttachment_jobId_createdAt_idx" ON "JobAttachment"("jobId", "createdAt");

-- CreateIndex
CREATE INDEX "JobAttachment_reportId_idx" ON "JobAttachment"("reportId");

-- CreateIndex
CREATE INDEX "JobAttachment_teamId_idx" ON "JobAttachment"("teamId");

-- CreateIndex
CREATE INDEX "JobAttachment_uploaderUserId_idx" ON "JobAttachment"("uploaderUserId");

-- CreateIndex
CREATE INDEX "JobAttachment_kind_createdAt_idx" ON "JobAttachment"("kind", "createdAt");

-- AddForeignKey
ALTER TABLE "JobReport" ADD CONSTRAINT "JobReport_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobReport" ADD CONSTRAINT "JobReport_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobReport" ADD CONSTRAINT "JobReport_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobReport" ADD CONSTRAINT "JobReport_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobAttachment" ADD CONSTRAINT "JobAttachment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobAttachment" ADD CONSTRAINT "JobAttachment_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobAttachment" ADD CONSTRAINT "JobAttachment_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "JobReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobAttachment" ADD CONSTRAINT "JobAttachment_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobAttachment" ADD CONSTRAINT "JobAttachment_uploaderUserId_fkey" FOREIGN KEY ("uploaderUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
