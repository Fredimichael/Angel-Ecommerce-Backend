import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { ProductsModule } from '../products/products.module';
import { SubcategoriesService } from 'src/subcategories/subcategories.service';

@Module({
  imports: [PrismaModule, ProductsModule],
  controllers: [CategoriesController],
  providers: [
    CategoriesService,
    SubcategoriesService,
  ],
})
export class CategoriesModule {}
