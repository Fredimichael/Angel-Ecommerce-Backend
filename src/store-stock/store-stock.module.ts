import { Module } from '@nestjs/common';
import { StoreStockService } from './store-stock.service';
import { StoreStockController } from './store-stock.controller';
import { PrismaService } from 'prisma/prisma.service';
@Module({
  providers: [StoreStockService, PrismaService],
  controllers: [StoreStockController],
})
export class StoreStockModule {}
