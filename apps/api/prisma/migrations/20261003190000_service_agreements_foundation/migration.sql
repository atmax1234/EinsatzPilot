-- CreateEnum
CREATE TYPE "ServiceAgreementStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RecurringDutyCadenceUnit" AS ENUM ('DAY', 'WEEK', 'MONTH', 'YEAR');

-- CreateTable
CREATE TABLE "ServiceAgreement" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ServiceAgreementStatus" NOT NULL DEFAULT 'DRAFT',
    "effectiveFrom" DATE NOT NULL,
    "effectiveUntil" DATE,
    "timezone" VARCHAR(100) NOT NULL DEFAULT 'Europe/Berlin',
    "customerId" TEXT,
    "addressId" TEXT,
    "objectId" TEXT,
    "objectAreaId" TEXT,
    "internalNotes" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "updatedByUserId" TEXT NOT NULL,
    "activatedByUserId" TEXT,
    "deactivatedByUserId" TEXT,
    "archivedByUserId" TEXT,
    "activatedAt" TIMESTAMP(3),
    "deactivatedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceAgreement_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ServiceAgreement_title_check" CHECK (btrim("title") <> ''),
    CONSTRAINT "ServiceAgreement_timezone_check" CHECK (btrim("timezone") <> ''),
    CONSTRAINT "ServiceAgreement_effective_dates_check" CHECK ("effectiveUntil" IS NULL OR "effectiveUntil" >= "effectiveFrom"),
    CONSTRAINT "ServiceAgreement_object_area_check" CHECK ("objectAreaId" IS NULL OR "objectId" IS NOT NULL),
    CONSTRAINT "ServiceAgreement_activation_actor_check" CHECK (("activatedAt" IS NULL) = ("activatedByUserId" IS NULL)),
    CONSTRAINT "ServiceAgreement_deactivation_actor_check" CHECK (("deactivatedAt" IS NULL) = ("deactivatedByUserId" IS NULL)),
    CONSTRAINT "ServiceAgreement_archive_actor_check" CHECK (("archivedAt" IS NULL) = ("archivedByUserId" IS NULL)),
    CONSTRAINT "ServiceAgreement_status_audit_check" CHECK (
      ("status" = 'DRAFT' AND "activatedAt" IS NULL AND "deactivatedAt" IS NULL AND "archivedAt" IS NULL)
      OR ("status" = 'ACTIVE' AND "activatedAt" IS NOT NULL AND "archivedAt" IS NULL)
      OR ("status" = 'INACTIVE' AND "activatedAt" IS NOT NULL AND "deactivatedAt" IS NOT NULL AND "archivedAt" IS NULL)
      OR ("status" = 'ARCHIVED' AND "archivedAt" IS NOT NULL)
    )
);

-- CreateTable
CREATE TABLE "RecurringObjectDuty" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "plannedText" TEXT NOT NULL,
    "notes" TEXT,
    "cadenceUnit" "RecurringDutyCadenceUnit" NOT NULL,
    "cadenceInterval" INTEGER NOT NULL DEFAULT 1,
    "firstDueDate" DATE NOT NULL,
    "startTime" VARCHAR(5),
    "endTime" VARCHAR(5),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdByUserId" TEXT NOT NULL,
    "updatedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringObjectDuty_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "RecurringObjectDuty_position_check" CHECK ("position" >= 0),
    CONSTRAINT "RecurringObjectDuty_text_check" CHECK (btrim("plannedText") <> ''),
    CONSTRAINT "RecurringObjectDuty_cadence_interval_check" CHECK ("cadenceInterval" BETWEEN 1 AND 999),
    CONSTRAINT "RecurringObjectDuty_start_time_check" CHECK ("startTime" IS NULL OR "startTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
    CONSTRAINT "RecurringObjectDuty_end_time_check" CHECK ("endTime" IS NULL OR "endTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
    CONSTRAINT "RecurringObjectDuty_time_range_check" CHECK ("startTime" IS NULL OR "endTime" IS NULL OR "endTime" > "startTime")
);

-- CreateIndex
CREATE INDEX "ServiceAgreement_companyId_status_effectiveFrom_idx" ON "ServiceAgreement"("companyId", "status", "effectiveFrom");
CREATE INDEX "ServiceAgreement_companyId_customerId_status_idx" ON "ServiceAgreement"("companyId", "customerId", "status");
CREATE INDEX "ServiceAgreement_companyId_objectId_status_idx" ON "ServiceAgreement"("companyId", "objectId", "status");
CREATE INDEX "ServiceAgreement_companyId_objectAreaId_idx" ON "ServiceAgreement"("companyId", "objectAreaId");
CREATE INDEX "ServiceAgreement_createdByUserId_idx" ON "ServiceAgreement"("createdByUserId");
CREATE INDEX "ServiceAgreement_updatedByUserId_idx" ON "ServiceAgreement"("updatedByUserId");
CREATE INDEX "ServiceAgreement_activatedByUserId_idx" ON "ServiceAgreement"("activatedByUserId");
CREATE INDEX "ServiceAgreement_deactivatedByUserId_idx" ON "ServiceAgreement"("deactivatedByUserId");
CREATE INDEX "ServiceAgreement_archivedByUserId_idx" ON "ServiceAgreement"("archivedByUserId");
CREATE UNIQUE INDEX "RecurringObjectDuty_agreementId_position_key" ON "RecurringObjectDuty"("agreementId", "position");
CREATE INDEX "RecurringObjectDuty_companyId_agreementId_isActive_idx" ON "RecurringObjectDuty"("companyId", "agreementId", "isActive");
CREATE INDEX "RecurringObjectDuty_companyId_firstDueDate_isActive_idx" ON "RecurringObjectDuty"("companyId", "firstDueDate", "isActive");
CREATE INDEX "RecurringObjectDuty_createdByUserId_idx" ON "RecurringObjectDuty"("createdByUserId");
CREATE INDEX "RecurringObjectDuty_updatedByUserId_idx" ON "RecurringObjectDuty"("updatedByUserId");

-- AddForeignKey
ALTER TABLE "ServiceAgreement" ADD CONSTRAINT "ServiceAgreement_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceAgreement" ADD CONSTRAINT "ServiceAgreement_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ServiceAgreement" ADD CONSTRAINT "ServiceAgreement_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ServiceAgreement" ADD CONSTRAINT "ServiceAgreement_objectId_fkey" FOREIGN KEY ("objectId") REFERENCES "Object"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ServiceAgreement" ADD CONSTRAINT "ServiceAgreement_objectAreaId_fkey" FOREIGN KEY ("objectAreaId") REFERENCES "ObjectArea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ServiceAgreement" ADD CONSTRAINT "ServiceAgreement_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ServiceAgreement" ADD CONSTRAINT "ServiceAgreement_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ServiceAgreement" ADD CONSTRAINT "ServiceAgreement_activatedByUserId_fkey" FOREIGN KEY ("activatedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ServiceAgreement" ADD CONSTRAINT "ServiceAgreement_deactivatedByUserId_fkey" FOREIGN KEY ("deactivatedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ServiceAgreement" ADD CONSTRAINT "ServiceAgreement_archivedByUserId_fkey" FOREIGN KEY ("archivedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RecurringObjectDuty" ADD CONSTRAINT "RecurringObjectDuty_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecurringObjectDuty" ADD CONSTRAINT "RecurringObjectDuty_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "ServiceAgreement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecurringObjectDuty" ADD CONSTRAINT "RecurringObjectDuty_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RecurringObjectDuty" ADD CONSTRAINT "RecurringObjectDuty_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
