-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "saleChannel" "SaleChannel",
ADD COLUMN     "storeId" TEXT;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;
