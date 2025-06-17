import { Controller, Get, Post, Body, Param, Delete, Put, UseInterceptors, BadRequestException, UploadedFile, Req } from '@nestjs/common';
import { SubcategoriesService } from './subcategories.service';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join, extname } from 'path';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import * as sharp from 'sharp';

@Controller('subcategories')
export class SubcategoriesController {
  constructor(private readonly subcategoriesService: SubcategoriesService) {}

  @Delete(':id')
  async deleteSubcategory(@Param('id') id: string) {
    return this.subcategoriesService.deleteSubcategory(id);
  }

  @Put(':id')
  async updateSubcategory(@Param('id') id: string, @Body() createSubcategoryDto: CreateSubcategoryDto) {
    return this.subcategoriesService.updateSubcategory(id, createSubcategoryDto);
  }

  @Get()
  async getAllSubcategories() {
    return this.subcategoriesService.getAllSubcategories();
  }

  @Get(':id')
  async getSubcategoryById(@Param('id') id: string) {
    return this.subcategoriesService.getSubcategoryById(id);
  }

  @Get('category/:categoryId')
  async getSubcategoriesByCategoryId(@Param('categoryId') categoryId: string) {
    return this.subcategoriesService.getSubcategoriesByCategoryId(categoryId);
  }

  @Post('create')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(process.cwd(), 'src', 'uploads', 'subcategories');
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const filename = `${uniqueSuffix}${extname(file.originalname)}`;
          cb(null, filename);
        },
      }),
    }),
  )
  async createSubcategory(@UploadedFile() file: Express.Multer.File, @Body() body: any, @Req() req: any) {
    if (!file) {
      throw new BadRequestException('No se ha subido ninguna imagen');
    }

    if (!body.categoryId) {
      throw new BadRequestException('El categoryId es requerido');
    }

    const originalFilePath = file.path;
    const webpFilename = `${file.filename.split('.')[0]}.webp`;
    const webpPath = join(process.cwd(), 'src', 'uploads', 'subcategories', webpFilename);

    try {
      await sharp(originalFilePath).webp().toFile(webpPath);
      unlinkSync(originalFilePath);

      const createSubcategoryDto = {
        name: body.name,
        image: `${req.protocol}://${req.get('host')}/uploads/subcategories/${webpFilename}`,
        categoryId: body.categoryId,
      };

      return this.subcategoriesService.createSubcategory(createSubcategoryDto);
    } catch (error) {
      if (existsSync(originalFilePath)) {
        unlinkSync(originalFilePath);
      }
      if (existsSync(webpPath)) {
        unlinkSync(webpPath);
      }
      throw new BadRequestException('Error al procesar la imagen: ' + error.message);
    }
  }
}