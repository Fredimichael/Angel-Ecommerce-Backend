import { Controller, Get, Post, Body, Param, Put, Delete, HttpException, HttpStatus, UseInterceptors, BadRequestException, UploadedFile} from '@nestjs/common';
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

  // Borrar una categoria
  @Delete(':id')
  async deleteCategory(@Param('id') id: string) {
    return this.categoriesService.deleteCategory(id);
  }

  //editar una categoria
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

  // Obtener todas las categorías
  @Get()
  async getAllCategories() {
    return this.categoriesService.getAllCategories();
  }

  // Obtener una categoría por ID
  @Get(':id')
  async getCategoryById(@Param('id') id: string) {
    return this.categoriesService.getCategoryById(id);
  }

  // Obtener subcategorías de una categoría
  @Get(':categoryId/subcategories')
  async getSubcategoriesByCategory(
    @Param('categoryId') categoryId: string,
  ) {
    return this.categoriesService.getSubcategoriesByCategoryId(categoryId);
  }

  // Obtener productos dentro de una categoría y subcategoría
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

  // Obtener un producto específico dentro de una categoría y subcategoría
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

  // Obtener todos los productos en oferta
  @Get('products/offers')
  async getProductsOnOffer() {
    return this.productsService.findProductsOnOffer();
  }

  // Obtener todos los productos nuevos
  @Get('products/news')
  async getNewProducts() {
    return this.productsService.findNewProducts();
  }

  // Crear una categoría
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
          const filename = `${uniqueSuffix}${extname(file.originalname)}`; // Guardar con la extensión original
          cb(null, filename);
        },
      }),
      fileFilter: (req, file, cb) => {
        // Tipos MIME permitidos
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/avif'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
          return cb(new BadRequestException('Tipo de archivo no permitido'), false);
        }
        cb(null, true);
      },
    }),
  )
  async createCategory(@UploadedFile() file: Express.Multer.File, @Body() body: any) {
    if (!file) {
      throw new BadRequestException('No se ha subido ninguna imagen');
    }

    // Ruta temporal para el archivo original
    const originalFilePath = file.path;

    // Ruta para el archivo convertido a WebP
    const webpFilename = `${file.filename.split('.')[0]}.webp`; // Cambiar la extensión a .webp
    const webpPath = join(process.cwd(), 'src', 'uploads', 'categories', webpFilename);

    try {
      // Convertir la imagen a WebP
      await sharp(originalFilePath) // Usar la ruta del archivo original
        .webp()
        .toFile(webpPath); // Guardar en una ruta diferente

      // Eliminar el archivo original después de la conversión
      unlinkSync(originalFilePath);

      // Crear el DTO con la URL de la imagen convertida
      const createCategoryDto = {
        ...body,
        image: `http://localhost:3000/uploads/categories/${webpFilename}`,
      };

      // Guardar la categoría en la base de datos
      return this.categoriesService.createCategory(createCategoryDto);
    } catch (error) {
      // Si hay un error, eliminar el archivo subido
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