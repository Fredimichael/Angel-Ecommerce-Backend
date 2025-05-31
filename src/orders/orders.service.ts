import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(createOrderDto: CreateOrderDto) {
    const { userId, sellerId, total, items } = createOrderDto;

    // Crear la orden
    const order = await this.prisma.order.create({
      data: {
        userId,  // El id del usuario que está haciendo la compra
        sellerId, // El id del vendedor
        total,    // El total de la compra
        orderItems: {
          create: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            total: item.quantity * item.price,  // Total por item
          })),
        },
      },
      include: {
        orderItems: true,  // Incluir los items de la orden para verificar la relación
      },
    });

    return order;
  }

  async getDailySales() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    return this.prisma.order.findMany({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        orderItems: true,
      },
    });
  }

  async getMonthlySales() {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    return this.prisma.order.findMany({
      where: {
        createdAt: {
          gte: firstDayOfMonth,
          lt: firstDayOfNextMonth,
        },
      },
      include: {
        orderItems: true,
      },
    });
  }

  async getAnnualSales() {
    const now = new Date();
    const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
    const firstDayOfNextYear = new Date(now.getFullYear() + 1, 0, 1);

    return this.prisma.order.findMany({
      where: {
        createdAt: {
          gte: firstDayOfYear,
          lt: firstDayOfNextYear,
        },
      },
      include: {
        orderItems: true,
      },
    });
  }

  // Obtener los productos más vendidos
  async getTopSales() {
    return this.prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 10, // Limitar a los 10 productos más vendidos
    });
  }
}