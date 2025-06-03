/*
  Warnings:

  - You are about to drop the column `pricePerUnit` on the `product_volume_discounts` table. All the data in the column will be lost.
  - Added the required column `discountPercentage` to the `product_volume_discounts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "product_volume_discounts" DROP COLUMN "pricePerUnit",
ADD COLUMN     "discountPercentage" DOUBLE PRECISION NOT NULL;
