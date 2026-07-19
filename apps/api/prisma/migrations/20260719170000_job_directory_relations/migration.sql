-- AlterTable
ALTER TABLE "Job"
ADD COLUMN "customerId" TEXT,
ADD COLUMN "addressId" TEXT,
ADD COLUMN "objectId" TEXT,
ADD COLUMN "objectAreaId" TEXT;

-- CreateIndex
CREATE INDEX "Job_companyId_customerId_idx" ON "Job"("companyId", "customerId");

-- CreateIndex
CREATE INDEX "Job_companyId_addressId_idx" ON "Job"("companyId", "addressId");

-- CreateIndex
CREATE INDEX "Job_companyId_objectId_idx" ON "Job"("companyId", "objectId");

-- CreateIndex
CREATE INDEX "Job_companyId_objectAreaId_idx" ON "Job"("companyId", "objectAreaId");

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_objectId_fkey" FOREIGN KEY ("objectId") REFERENCES "Object"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_objectAreaId_fkey" FOREIGN KEY ("objectAreaId") REFERENCES "ObjectArea"("id") ON DELETE SET NULL ON UPDATE CASCADE;
