import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStoreDto } from './dto/create-store.dto';

@Injectable()
export class StoresService {
  constructor(private prisma: PrismaService) {}

  async deleteStore(id: string) {
    return await this.prisma.store.delete({
      where: { id },
    });
  }

  async createStore(createStoreDto: CreateStoreDto) {
    if (!createStoreDto.name || !createStoreDto.address) {
      throw new BadRequestException('Name and address are required');
    }

    return await this.prisma.store.create({
      data: {
        name: createStoreDto.name,
        address: createStoreDto.address,
      },
    });
  }

  async getStores() {
    return await this.prisma.store.findMany();
  }

  async transferProduct(fromStoreId: string, toStoreId: string, productId: string, quantity: number) {
    const fromStoreProduct = await this.prisma.storeProduct.findUnique({
      where: { storeId_productId: { storeId: fromStoreId, productId } },
    });

    if (!fromStoreProduct || fromStoreProduct.quantity < quantity) {
      throw new BadRequestException('Stock insuficiente en la sucursal de origen');
    }

    await this.prisma.$transaction(async (prisma) => {
      await prisma.storeProduct.update({
        where: { storeId_productId: { storeId: fromStoreId, productId } },
        data: { quantity: { decrement: quantity } },
      });

      const toStoreProduct = await prisma.storeProduct.findUnique({
        where: { storeId_productId: { storeId: toStoreId, productId } },
      });

      if (toStoreProduct) {
        await prisma.storeProduct.update({
          where: { storeId_productId: { storeId: toStoreId, productId } },
          data: { quantity: { increment: quantity } },
        });
      } else {
        await prisma.storeProduct.create({
          data: { storeId: toStoreId, productId, quantity },
        });
      }
    });

    return { message: 'Transferencia realizada exitosamente' };
  }
}
