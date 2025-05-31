import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateStockDto } from './dtos/update-stock.dto';
import { TransferStockDto } from './dtos/transfer-stock.dto';

@Injectable()
export class StoreStockService {
  constructor(private prisma: PrismaService) {}

  async getProductStock(storeId: string, productId: string) {
    return await this.prisma.storeProduct.findUnique({
      where: {
        storeId_productId: {
          storeId,
          productId,
        },
      },
    });
  }

  async getStoreProducts(storeId: string) {
    return await this.prisma.storeProduct.findMany({
      where: {
        storeId,
      },
      include: {
        product: true,
      },
    });
  }

  async updateProductStock(updateStockDto: UpdateStockDto) {
    const { storeId, productId, quantity } = updateStockDto;
    return await this.prisma.storeProduct.update({
      where: {
        storeId_productId: {
          storeId,
          productId,
        },
      },
      data: {
        quantity,
      },
    });
  }

  async transferStock(transferStockDto: TransferStockDto) {
    const { fromStoreId, toStoreId, products } = transferStockDto;
    const results = [];

    console.log("Transferencia iniciada:", transferStockDto); // Log inicial

    try {
      await this.prisma.$transaction(async (prisma) => {
        for (const { productId, quantity } of products) {
          console.log(`Procesando producto ${productId} con cantidad ${quantity}`); // Log de cada producto

          const fromStoreProduct = await prisma.storeProduct.findUnique({
            where: {
              storeId_productId: {
                storeId: fromStoreId,
                productId,
              },
            },
          });

          if (!fromStoreProduct) {
            console.error(`Producto ${productId} no encontrado en la sucursal ${fromStoreId}`); // Log de error
            throw new Error(`Producto ${productId} no encontrado en la sucursal de origen`);
          }

          if (fromStoreProduct.quantity < quantity) {
            console.error(`Stock insuficiente para el producto ${productId} en la sucursal ${fromStoreId}`); // Log de error
            throw new Error(`Stock insuficiente para el producto ${productId} en la sucursal de origen`);
          }

          console.log(`Actualizando stock en la sucursal de origen (${fromStoreId})`); // Log de actualización
          await prisma.storeProduct.update({
            where: {
              storeId_productId: {
                storeId: fromStoreId,
                productId,
              },
            },
            data: {
              quantity: fromStoreProduct.quantity - quantity,
            },
          });

          console.log(`Actualizando o creando stock en la sucursal de destino (${toStoreId})`); // Log de actualización
          const toStoreProduct = await prisma.storeProduct.upsert({
            where: {
              storeId_productId: {
                storeId: toStoreId,
                productId,
              },
            },
            update: {
              quantity: {
                increment: quantity,
              },
            },
            create: {
              storeId: toStoreId,
              productId,
              quantity,
            },
          });

          console.log(`Creando registro de transferencia para el producto ${productId}`); // Log de transferencia
          await prisma.stockTransfer.create({
            data: {
              fromStoreId,
              toStoreId,
              productId,
              quantity,
            },
          });

          results.push(toStoreProduct);
        }
      });

      console.log("Transferencia completada con éxito:", results); // Log de éxito
      return results;
    } catch (error) {
      console.error("Error durante la transferencia de stock:", error); // Log de error
      throw new Error("Error durante la transferencia de stock: " + error.message);
    }
  }

  async getStockTransfers() {
    return await this.prisma.stockTransfer.findMany({
      include: {
        fromStore: true,
        toStore: true,
        product: true,
      },
    });
  }
}