import { Controller, Get, Post, Body, Param, Put, Delete, HttpException, HttpStatus, UseInterceptors, BadRequestException, UploadedFile, Req } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { ProductsService } from '../products/products.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join, extname } from 'path';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import * as sharp from 'sharp';
import fs from 'fs';

@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly productsService: ProductsService,
  ) {}

  @Delete(':id')
  async deleteCategory(@Param('id') id: string) {
    return this.categoriesService.deleteCategory(id);
  }

  @Put(':id')
  async updateCategory(@Param('id') id: string, @Body() updateCategoryDto: CreateCategoryDto) {
    try {
      return await this.categoriesService.updateCategory(id, updateCategoryDto);
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get()
  async getAllCategories() {
    return this.categoriesService.getAllCategories();
  }

  @Get(':id')
  async getCategoryById(@Param('id') id: string) {
    return this.categoriesService.getCategoryById(id);
  }

  @Get(':categoryId/subcategories')
  async getSubcategoriesByCategory(
    @Param('categoryId') categoryId: string,
  ) {
    return this.categoriesService.getSubcategoriesByCategoryId(categoryId);
  }

  @Get(':categoryId/subcategories/:subcategoryId/products')
  async getProductsByCategoryAndSubcategory(
    @Param('categoryId') categoryId: string,
    @Param('subcategoryId') subcategoryId: string,
  ) {
    return this.productsService.findByCategoryAndSubcategory(
      categoryId,
      subcategoryId,
    );
  }

  @Get(':categoryId/subcategories/:subcategoryId/products/:productId')
  async getProductByCategorySubcategoryAndId(
    @Param('categoryId') categoryId: string,
    @Param('subcategoryId') subcategoryId: string,
    @Param('productId') productId: string,
  ) {
    return this.productsService.findProductByCategorySubcategoryAndId(
      categoryId,
      subcategoryId,
      productId,
    );
  }

  @Get('products/offers')
  async getProductsOnOffer() {
    return this.productsService.findProductsOnOffer();
  }

  @Get('products/news')
  async getNewProducts() {
    return this.productsService.findNewProducts();
  }

  @Post('create')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(process.cwd(), 'src', 'uploads', 'categories');
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
  async createCategory(@UploadedFile() file: Express.Multer.File, @Body() body: any, @Req() req: any) {
    if (!file) {
      throw new BadRequestException('No se ha subido ninguna imagen');
    }

    const originalFilePath = file.path;
    const webpFilename = `${file.filename.split('.')[0]}.webp`;
    const webpPath = join(process.cwd(), 'src', 'uploads', 'categories', webpFilename);

    try {
      await sharp(originalFilePath).webp().toFile(webpPath);
      unlinkSync(originalFilePath);

      const createCategoryDto = {
        ...body,
        image: `${req.protocol}://${req.get('host')}/uploads/categories/${webpFilename}`,
      };

          // --- LÍNEA DE PRUEBA INFALIBLE ---
    console.log('====== URL GENERADA POR EL BACKEND ======');
    console.log(createCategoryDto.image);
    console.log('=======================================');
    // -------------------------------------
      return this.categoriesService.createCategory(createCategoryDto);
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