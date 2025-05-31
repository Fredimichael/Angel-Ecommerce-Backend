// sellers.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';  // Asegúrate de que la ruta de PrismaModule sea correcta
import { SellersService } from './sellers.service';
import { SellersController } from './sellers.controller';

@Module({
  imports: [PrismaModule],  // Importamos PrismaModule aquí
  providers: [SellersService],
  controllers: [SellersController],
})
export class SellersModule {}
