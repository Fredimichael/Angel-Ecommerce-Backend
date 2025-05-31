import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Hacer el módulo global para que PrismaService esté disponible en toda la aplicación
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // Exportar PrismaService para que otros módulos puedan usarlo
})
export class PrismaModule {}