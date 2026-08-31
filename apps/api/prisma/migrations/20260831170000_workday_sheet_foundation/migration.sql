-- CreateEnum
CREATE TYPE "WorkdaySheetStatus" AS ENUM ('DRAFT', 'SENT', 'SUBMITTED', 'REVIEWED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "WorkdaySheet" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "title" TEXT,
    "status" "WorkdaySheetStatus" NOT NULL DEFAULT 'DRAFT',
    "teamId" TEXT,
    "workerUserId" TEXT,
    "internalNotes" TEXT,
    "reviewNotes" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "sentByUserId" TEXT,
    "submittedByUserId" TEXT,
    "reviewedByUserId" TEXT,
    "archivedByUserId" TEXT,
    "sentAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkdaySheet_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "WorkdaySheet_title_nonblank_check" CHECK ("title" IS NULL OR btrim("title") <> ''),
    CONSTRAINT "WorkdaySheet_actor_time_pairs_check" CHECK (
      (("sentByUserId" IS NULL AND "sentAt" IS NULL) OR ("sentByUserId" IS NOT NULL AND "sentAt" IS NOT NULL)) AND
      (("submittedByUserId" IS NULL AND "submittedAt" IS NULL) OR ("submittedByUserId" IS NOT NULL AND "submittedAt" IS NOT NULL)) AND
      (("reviewedByUserId" IS NULL AND "reviewedAt" IS NULL) OR ("reviewedByUserId" IS NOT NULL AND "reviewedAt" IS NOT NULL)) AND
      (("archivedByUserId" IS NULL AND "archivedAt" IS NULL) OR ("archivedByUserId" IS NOT NULL AND "archivedAt" IS NOT NULL))
    ),
    CONSTRAINT "WorkdaySheet_status_audit_check" CHECK (
      ("status" = 'DRAFT' AND "sentAt" IS NULL AND "submittedAt" IS NULL AND "reviewedAt" IS NULL AND "archivedAt" IS NULL) OR
      ("status" = 'SENT' AND "sentAt" IS NOT NULL AND "submittedAt" IS NULL AND "reviewedAt" IS NULL AND "archivedAt" IS NULL) OR
      ("status" = 'SUBMITTED' AND "sentAt" IS NOT NULL AND "submittedAt" IS NOT NULL AND "reviewedAt" IS NULL AND "archivedAt" IS NULL) OR
      ("status" = 'REVIEWED' AND "sentAt" IS NOT NULL AND "submittedAt" IS NOT NULL AND "reviewedAt" IS NOT NULL AND "archivedAt" IS NULL) OR
      ("status" = 'ARCHIVED' AND "sentAt" IS NOT NULL AND "submittedAt" IS NOT NULL AND "reviewedAt" IS NOT NULL AND "archivedAt" IS NOT NULL)
    )
);

-- CreateTable
CREATE TABLE "WorkdaySheetRow" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "sheetId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "startTime" VARCHAR(5),
    "endTime" VARCHAR(5),
    "plannedText" TEXT NOT NULL,
    "actualText" TEXT,
    "notes" TEXT,
    "customerId" TEXT,
    "addressId" TEXT,
    "objectId" TEXT,
    "objectAreaId" TEXT,
    "jobId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkdaySheetRow_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "WorkdaySheetRow_position_check" CHECK ("position" >= 0),
    CONSTRAINT "WorkdaySheetRow_planned_text_check" CHECK (btrim("plannedText") <> ''),
    CONSTRAINT "WorkdaySheetRow_actual_text_check" CHECK ("actualText" IS NULL OR btrim("actualText") <> ''),
    CONSTRAINT "WorkdaySheetRow_time_format_check" CHECK (
      ("startTime" IS NULL OR "startTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$') AND
      ("endTime" IS NULL OR "endTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$')
    ),
    CONSTRAINT "WorkdaySheetRow_time_range_check" CHECK (
      "startTime" IS NULL OR "endTime" IS NULL OR "endTime" > "startTime"
    )
);

-- CreateIndex
CREATE INDEX "WorkdaySheet_companyId_date_status_idx" ON "WorkdaySheet"("companyId", "date", "status");
CREATE INDEX "WorkdaySheet_companyId_teamId_date_idx" ON "WorkdaySheet"("companyId", "teamId", "date");
CREATE INDEX "WorkdaySheet_companyId_workerUserId_date_idx" ON "WorkdaySheet"("companyId", "workerUserId", "date");
CREATE INDEX "WorkdaySheet_createdByUserId_idx" ON "WorkdaySheet"("createdByUserId");
CREATE INDEX "WorkdaySheet_sentByUserId_idx" ON "WorkdaySheet"("sentByUserId");
CREATE INDEX "WorkdaySheet_submittedByUserId_idx" ON "WorkdaySheet"("submittedByUserId");
CREATE INDEX "WorkdaySheet_reviewedByUserId_idx" ON "WorkdaySheet"("reviewedByUserId");
CREATE INDEX "WorkdaySheet_archivedByUserId_idx" ON "WorkdaySheet"("archivedByUserId");
CREATE UNIQUE INDEX "WorkdaySheetRow_sheetId_position_key" ON "WorkdaySheetRow"("sheetId", "position");
CREATE INDEX "WorkdaySheetRow_companyId_sheetId_idx" ON "WorkdaySheetRow"("companyId", "sheetId");
CREATE INDEX "WorkdaySheetRow_companyId_customerId_idx" ON "WorkdaySheetRow"("companyId", "customerId");
CREATE INDEX "WorkdaySheetRow_companyId_addressId_idx" ON "WorkdaySheetRow"("companyId", "addressId");
CREATE INDEX "WorkdaySheetRow_companyId_objectId_idx" ON "WorkdaySheetRow"("companyId", "objectId");
CREATE INDEX "WorkdaySheetRow_companyId_objectAreaId_idx" ON "WorkdaySheetRow"("companyId", "objectAreaId");
CREATE INDEX "WorkdaySheetRow_companyId_jobId_idx" ON "WorkdaySheetRow"("companyId", "jobId");

-- AddForeignKey
ALTER TABLE "WorkdaySheet" ADD CONSTRAINT "WorkdaySheet_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkdaySheet" ADD CONSTRAINT "WorkdaySheet_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkdaySheet" ADD CONSTRAINT "WorkdaySheet_workerUserId_fkey" FOREIGN KEY ("workerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkdaySheet" ADD CONSTRAINT "WorkdaySheet_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WorkdaySheet" ADD CONSTRAINT "WorkdaySheet_sentByUserId_fkey" FOREIGN KEY ("sentByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WorkdaySheet" ADD CONSTRAINT "WorkdaySheet_submittedByUserId_fkey" FOREIGN KEY ("submittedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WorkdaySheet" ADD CONSTRAINT "WorkdaySheet_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WorkdaySheet" ADD CONSTRAINT "WorkdaySheet_archivedByUserId_fkey" FOREIGN KEY ("archivedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WorkdaySheetRow" ADD CONSTRAINT "WorkdaySheetRow_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkdaySheetRow" ADD CONSTRAINT "WorkdaySheetRow_sheetId_fkey" FOREIGN KEY ("sheetId") REFERENCES "WorkdaySheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkdaySheetRow" ADD CONSTRAINT "WorkdaySheetRow_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkdaySheetRow" ADD CONSTRAINT "WorkdaySheetRow_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkdaySheetRow" ADD CONSTRAINT "WorkdaySheetRow_objectId_fkey" FOREIGN KEY ("objectId") REFERENCES "Object"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkdaySheetRow" ADD CONSTRAINT "WorkdaySheetRow_objectAreaId_fkey" FOREIGN KEY ("objectAreaId") REFERENCES "ObjectArea"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkdaySheetRow" ADD CONSTRAINT "WorkdaySheetRow_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;
