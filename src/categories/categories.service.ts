import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { join } from 'path';
import { existsSync, unlinkSync } from 'fs';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  // Borrar una categoría
  async deleteCategory(id: string) {
    try {
      // Obtener la categoría para obtener la ruta de la imagen
      const category = await this.prisma.category.findUnique({
        where: { id },
      });
  
      if (!category) {
        throw new BadRequestException('Categoría no encontrada');
      }
  
      // Eliminar todas las subcategorías asociadas
      await this.prisma.subcategory.deleteMany({
        where: {
          categoryId: id,
        },
      });
  
      // Eliminar la categoría
      await this.prisma.category.delete({
        where: { id },
      });
  
      // Eliminar el archivo de la imagen
      if (category.image) {
        // Extraer el nombre del archivo de la URL
        const imageName = category.image.split('/').pop(); // Obtener el nombre del archivo desde la URL
        const imagePath = join(process.cwd(), 'src', 'uploads', 'categories', imageName);
  
        if (existsSync(imagePath)) {
          unlinkSync(imagePath);
        }
      }
  
      return { message: 'Categoría eliminada exitosamente' };
    } catch (error) {
      throw new BadRequestException(`Error al eliminar la categoría: ${error.message}`);
    }
  }
  // Editar una categoría
  async updateCategory(id: string, updateCategoryDto: CreateCategoryDto) {
    try {
      // Verificar si la categoría existe
      const existingCategory = await this.prisma.category.findUnique({
        where: { id },
      });

      if (!existingCategory) {
        throw new NotFoundException('Categoría no encontrada');
      }

      // Actualizar la categoría
      return await this.prisma.category.update({
        where: { id },
        data: {
          name: updateCategoryDto.name,
          image: updateCategoryDto.image,
        },
        include: {
          subcategories: true, // Incluir subcategorías en la respuesta
        },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new BadRequestException(`Error al actualizar la categoría: ${error.message}`);
      }
      throw error;
    }
  }

  // Obtener todas las categorías con sus subcategorías
  async getAllCategories() {
    return this.prisma.category.findMany({
      include: {
        subcategories: true, // Incluye las subcategorías
      },
    });
  }

  // Obtener una categoría por su ID, incluyendo sus subcategorías
  async getCategoryById(id: string) {
    return this.prisma.category.findUnique({
      where: { id },
      include: {
        subcategories: true, // Incluye las subcategorías
      },
    });
  }
  
  // Obtener subcategorías por ID de categoría
  async getSubcategoriesByCategoryId(categoryId: string) {
    return this.prisma.subcategory.findMany({
      where: { categoryId },
    });
  }

  // crear una categoría
  async createCategory(createCategoryDto: CreateCategoryDto) {
    try {
      return await this.prisma.category.create({
        data: {
          name: createCategoryDto.name,
          image: createCategoryDto.image,
          // Si hay subcategorías, las conectamos
          ...(createCategoryDto.subcategories && {
            subcategories: {
              connect: createCategoryDto.subcategories.map(id => ({ id }))
            }
          })
        }
      });
    } catch (error) {
      throw new BadRequestException('Error al crear la categoría: ' + error.message);
    }
  }
}
