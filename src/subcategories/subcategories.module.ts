import { Module } from '@nestjs/common';
import { SubcategoriesController } from './subcategories.controller';
import { SubcategoriesService } from './subcategories.service';  // Importa SubcategoriesService
import { PrismaModule } from '../../prisma/prisma.module';  // Asegúrate de importar PrismaModule

@Module({
  imports: [PrismaModule],  // Importa PrismaModule aquí
  controllers: [SubcategoriesController],
  providers: [SubcategoriesService],  // Registra SubcategoriesService aquí
})
export class SubcategoriesModule {}
