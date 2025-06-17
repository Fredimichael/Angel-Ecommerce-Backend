import {
  Controller,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseInterceptors,
  UploadedFiles,
  HttpException,
  HttpStatus,
  NotFoundException,
  Get,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync, promises as fs } from 'fs';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import sharp from 'sharp';

async function convertToWebP(filePath: string, outputPath: string): Promise<void> {
  await sharp(filePath)
    .webp()
    .toFile(outputPath);
}

@Controller('products')
export class ProductsController {
  constructor(private readonly productService: ProductsService) {}

  @Get()
  async getAllProducts() {
    try {
      const products = await this.productService.findAll();
      return { message: 'Productos obtenidos exitosamente', products };
    } catch (error) {
      throw new HttpException(
        'Error al obtener los productos',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('out-of-stock')
  async getOutOfStockProducts() {
    try {
      const products = await this.productService.findOutOfStockProducts();
      return { message: 'Productos sin stock obtenidos exitosamente', products };
    } catch (error) {
      throw new HttpException(
        'Error al obtener productos sin stock',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('low-stock')
  async getLowStockProducts() {
    try {
      const products = await this.productService.findLowStockProducts();
      return { message: 'Productos con bajo stock obtenidos exitosamente', products };
    } catch (error) {
      throw new HttpException(
        'Error al obtener productos con bajo stock',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('offers')
  async getProductsOnOffer() {
    try {
      const products = await this.productService.findProductsOnOffer();
      return { message: 'Productos en oferta obtenidos exitosamente', products };
    } catch (error) {
      throw new HttpException(
        'Error al obtener productos en oferta',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('new')
  async getNewProducts() {
    try {
      const products = await this.productService.findNewProducts();
      return { message: 'Productos nuevos obtenidos exitosamente', products };
    } catch (error) {
      throw new HttpException(
        'Error al obtener productos nuevos',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async getProductById(@Param('id') id: string) {
    try {
      const product = await this.productService.findById(id);
      if (!product) {
        throw new NotFoundException(`Producto con ID ${id} no encontrado`);
      }
      return { message: 'Producto obtenido exitosamente', product };
    } catch (error) {
      if (error.status === 404) {
        throw new NotFoundException(error.message);
      }
      throw new HttpException(
        'Error al obtener el producto',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('create')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(process.cwd(), 'src', 'uploads', 'products');
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const extension = extname(file.originalname).toLowerCase();
          const filename = `${uniqueSuffix}${extension}`;
          cb(null, filename);
        },
      }),
    }),
  )
  async createProduct(@Body() body: any, @UploadedFiles() files: Express.Multer.File[], @Req() req: any) {
    try {
      const createProductDto: CreateProductDto = {
        ...body,
        price: parseFloat(body.price),
        cost: parseFloat(body.cost),
        tax: parseFloat(body.tax),
        weightKg: parseFloat(body.weightKg),
        unitsPerBox: parseInt(body.unitsPerBox),
        unitsPerBulk: parseInt(body.unitsPerBulk),
        initialStock: parseInt(body.initialStock),
        supplierId: parseInt(body.supplierId),
        onOffer: body.onOffer === 'true',
        isNew: body.isNew === 'true',
        wholesalePrice: parseFloat(body.wholesalePrice),
        minWholesaleQty: parseInt(body.minWholesaleQty),
        hidden: body.hidden === 'true',
        image: files?.map(file => `${req.protocol}://${req.get('host')}/uploads/products/${file.filename}`) || [],
      };

      const product = await this.productService.createProduct(createProductDto);

      return {
        success: true,
        message: 'Producto creado exitosamente',
        product,
      };
    } catch (error) {
      if (files && Array.isArray(files) && files.length > 0) {
        for (const file of files) {
          const filePath = join(process.cwd(), 'src', 'uploads', 'products', file.filename);
          if (existsSync(filePath)) {
            await fs.unlink(filePath);
          }
        }
      }
      throw new HttpException({
        success: false,
        message: 'Error al crear el producto',
        error: error.message
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('store/:storeId')
  async getProductsByStore(@Param('storeId') storeId: string) {
    try {
      const products = await this.productService.findProductsByStore(storeId);
      return {
        success: true,
        message: 'Productos obtenidos exitosamente',
        products
      };
    } catch (error) {
      console.error('Error en el controlador:', error);
      throw new HttpException(
        'Error al obtener los productos de la sucursal',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  async updateProduct(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    try {
      const updatedProduct = await this.productService.updateProduct(id, updateProductDto);
      return { message: 'Producto actualizado exitosamente', product: updatedProduct };
    } catch (error) {
      throw new HttpException(
        'Error al actualizar el producto',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  async deleteProduct(@Param('id') id: string) {
    try {
      const deletedProduct = await this.productService.deleteProduct(id);
      return { 
        success: true,
        message: 'Producto eliminado exitosamente', 
        product: deletedProduct 
      };
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw new HttpException(
        {
          success: false,
          message: 'Error al eliminar el producto',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}