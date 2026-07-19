-- CreateEnum
CREATE TYPE "AssignmentEntityType" AS ENUM ('USER', 'TEAM', 'JOB', 'CUSTOMER', 'ADDRESS', 'OBJECT', 'OBJECT_AREA', 'ITEM');

-- CreateEnum
CREATE TYPE "AssignmentKind" AS ENUM ('RESPONSIBLE', 'SCHEDULED', 'ALLOCATED', 'RESERVED', 'SUPPORTING', 'OTHER');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('ACTIVE', 'PLANNED', 'ENDED', 'CANCELED');

-- CreateTable
CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "sourceType" "AssignmentEntityType" NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetType" "AssignmentEntityType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "kind" "AssignmentKind" NOT NULL,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Assignment_time_range_check" CHECK (
      "startsAt" IS NULL OR "endsAt" IS NULL OR "endsAt" > "startsAt"
    ),
    CONSTRAINT "Assignment_distinct_entities_check" CHECK (
      "sourceType" <> "targetType" OR "sourceId" <> "targetId"
    )
);

-- Active assignment identity is unique while ended/canceled history remains appendable.
CREATE UNIQUE INDEX "Assignment_active_identity_key"
ON "Assignment"("companyId", "sourceType", "sourceId", "targetType", "targetId", "kind")
WHERE "status" = 'ACTIVE';

-- CreateIndex
CREATE INDEX "Assignment_companyId_status_idx" ON "Assignment"("companyId", "status");

-- CreateIndex
CREATE INDEX "Assignment_companyId_sourceType_sourceId_idx" ON "Assignment"("companyId", "sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "Assignment_companyId_targetType_targetId_idx" ON "Assignment"("companyId", "targetType", "targetId");

-- CreateIndex
CREATE INDEX "Assignment_companyId_kind_idx" ON "Assignment"("companyId", "kind");

-- CreateIndex
CREATE INDEX "Assignment_companyId_startsAt_idx" ON "Assignment"("companyId", "startsAt");

-- CreateIndex
CREATE INDEX "Assignment_createdByUserId_idx" ON "Assignment"("createdByUserId");

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
