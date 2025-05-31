import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SellersService {
  constructor(private readonly prisma: PrismaService) {}

  async createSeller(data: { name: string; email: string }) {
    return await this.prisma.seller.create({ data });
  }

  async getAllSellers() {
    return await this.prisma.seller.findMany();
  }

  async getOrdersBySeller(sellerId: number) {
    return await this.prisma.order.findMany({
      where: { sellerId },
      include: { orderItems: { include: { product: true } } }, // Detalles de productos en cada orden
    });
  }
}
