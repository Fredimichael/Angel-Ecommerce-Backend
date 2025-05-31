import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { join } from 'path';
import { existsSync, unlinkSync } from 'fs';


@Injectable()
export class SubcategoriesService {
  constructor(private readonly prisma: PrismaService) {}


  // **Método para eliminar una subcategoría**
  async deleteSubcategory(id: string) {
    try {
      // Obtener la subcategoría para obtener la ruta de la imagen
      const subcategory = await this.prisma.subcategory.findUnique({
        where: { id },
      });
  
      if (!subcategory) {
        throw new BadRequestException('Subcategoría no encontrada');
      }
  
      // Eliminar la subcategoría
      await this.prisma.subcategory.delete({
        where: { id },
      });
  
      // Eliminar el archivo de la imagen
      if (subcategory.image) {
        // Extraer el nombre del archivo de la URL
        const imageName = subcategory.image.split('/').pop(); // Obtener el nombre del archivo desde la URL
        const imagePath = join(process.cwd(), 'src', 'uploads', 'subcategories', imageName);
  
        if (existsSync(imagePath)) {
          unlinkSync(imagePath);
        }
      }
  
      return { message: 'Subcategoría eliminada exitosamente' };
    } catch (error) {
      throw new BadRequestException(`Error al eliminar la subcategoría: ${error.message}`);
    }
  }

  // **Método para editar una subcategoría**
  async updateSubcategory(id: string, createSubcategoryDto: CreateSubcategoryDto) {
    return this.prisma.subcategory.update({
      where: { id },
      data: {
        name: createSubcategoryDto.name,
        image: createSubcategoryDto.image,
        category: {
          connect: {
            id: createSubcategoryDto.categoryId
          }
        }
      },
      include: {
        category: true
      }
    });
  }

  // Obtener todas las subcategorías
  async getAllSubcategories() {
    return this.prisma.subcategory.findMany({
      include: {
        products: true, // Si deseas incluir productos también
      },
    });
  }

  // Obtener subcategorías por categoría
  async getSubcategoriesByCategoryId(categoryId: string) {
    return this.prisma.subcategory.findMany({
      where: {
        categoryId: categoryId,
      },
      include: {
        products: true, // Si deseas incluir productos en la respuesta
      },
    });
  }

  // **Método para obtener una subcategoría por ID**
  async getSubcategoryById(id: string) {
    return this.prisma.subcategory.findUnique({
      where: { id },
      include: {
        products: true, // Si deseas incluir productos relacionados
      },
    });
  }

  // **Método para crear una subcategoría**
  async createSubcategory(createSubcategoryDto: CreateSubcategoryDto) {
    try {
      return await this.prisma.subcategory.create({
        data: {
          name: createSubcategoryDto.name,
          image: createSubcategoryDto.image,
          category: {
            connect: {
              id: createSubcategoryDto.categoryId, // Asegúrate de que categoryId esté presente
            },
          },
        },
        include: {
          category: true,
        },
      });
    } catch (error) {
      throw new BadRequestException(`Error al crear la subcategoría: ${error.message}`);
    }
  }
}
