import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PrismaModule } from '../../prisma/prisma.module'; // Importar PrismaModule
import { ProductsModule } from '../products/products.module'; // Importar ProductsModule
import { MercadopagoModule } from '../mercadopago/mercadopago.module'; // Importar MercadopagoModule

@Module({
  imports: [ProductsModule, PrismaModule, MercadopagoModule], // Asegurarse de importar MercadopagoModule
  controllers: [OrdersController],
  providers: [OrdersService], // PrismaService ya está disponible gracias a PrismaModule
})
export class OrdersModule {}