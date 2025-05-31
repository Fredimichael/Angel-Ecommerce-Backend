// src/sales/sales.module.ts
import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { PrismaModule } from '../../prisma/prisma.module'; // Importa PrismaModule

@Module({
  imports: [PrismaModule], // Asegúrate de que PrismaService esté disponible
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService], // Exporta el servicio si otros módulos lo necesitan
})
export class SalesModule {}