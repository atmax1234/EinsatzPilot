-- CreateEnum
CREATE TYPE "ItemKind" AS ENUM ('MATERIAL', 'TOOL', 'ASSET', 'CONSUMABLE', 'PACKAGE', 'OTHER');

-- CreateEnum
CREATE TYPE "ItemUnit" AS ENUM ('PIECE', 'KG', 'LITER', 'METER', 'SQUARE_METER', 'CUBIC_METER', 'PALLET', 'BOX', 'BAG', 'OTHER');

-- CreateEnum
CREATE TYPE "ItemTrackingMode" AS ENUM ('QUANTITY', 'SERIALIZED');

-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DAMAGED', 'LOST', 'ARCHIVED');

-- CreateTable
CREATE TABLE "ItemCategory" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "kind" "ItemKind" NOT NULL DEFAULT 'OTHER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "categoryId" TEXT,
    "customId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "kind" "ItemKind" NOT NULL DEFAULT 'OTHER',
    "unit" "ItemUnit" NOT NULL DEFAULT 'PIECE',
    "trackingMode" "ItemTrackingMode" NOT NULL DEFAULT 'QUANTITY',
    "quantity" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "status" "ItemStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Item_tracking_quantity_check" CHECK (
      ("trackingMode" = 'QUANTITY' AND "quantity" >= 0) OR
      ("trackingMode" = 'SERIALIZED' AND "quantity" = 1)
    )
);

-- CreateIndex
CREATE UNIQUE INDEX "ItemCategory_companyId_name_key" ON "ItemCategory"("companyId", "name");

-- CreateIndex
CREATE INDEX "ItemCategory_companyId_isActive_idx" ON "ItemCategory"("companyId", "isActive");

-- CreateIndex
CREATE INDEX "ItemCategory_companyId_kind_idx" ON "ItemCategory"("companyId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "Item_companyId_customId_key" ON "Item"("companyId", "customId");

-- CreateIndex
CREATE INDEX "Item_companyId_name_idx" ON "Item"("companyId", "name");

-- CreateIndex
CREATE INDEX "Item_companyId_categoryId_idx" ON "Item"("companyId", "categoryId");

-- CreateIndex
CREATE INDEX "Item_companyId_kind_idx" ON "Item"("companyId", "kind");

-- CreateIndex
CREATE INDEX "Item_companyId_status_idx" ON "Item"("companyId", "status");

-- AddForeignKey
ALTER TABLE "ItemCategory" ADD CONSTRAINT "ItemCategory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ItemCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
