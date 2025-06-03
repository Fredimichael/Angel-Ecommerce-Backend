-- CreateTable
CREATE TABLE "product_volume_discounts" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "minQuantity" INTEGER NOT NULL,
    "pricePerUnit" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_volume_discounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_box_configs" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantityInBox" INTEGER NOT NULL,
    "totalBoxPrice" DOUBLE PRECISION NOT NULL,
    "sku" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_box_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_volume_discounts_productId_minQuantity_key" ON "product_volume_discounts"("productId", "minQuantity");

-- CreateIndex
CREATE UNIQUE INDEX "product_box_configs_sku_key" ON "product_box_configs"("sku");

-- AddForeignKey
ALTER TABLE "product_volume_discounts" ADD CONSTRAINT "product_volume_discounts_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_box_configs" ADD CONSTRAINT "product_box_configs_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
