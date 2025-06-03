// src/products/products.controller.ts
import {
  Controller, Post, Put, Delete, Body, Param, UseInterceptors,
  UploadedFiles, HttpException, HttpStatus, NotFoundException, Get,
  BadRequestException, // Asegúrate de importar BadRequestException
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync, promises as fsPromises } from 'fs'; // fs.promises
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
// No necesitas importar sharp aquí si el servicio ya no lo usa para crear el producto


@Controller('products')
export class ProductsController {
  constructor(private readonly productService: ProductsService) {}

  @Get()
  async getAllProducts() {
    try {
      const products = await this.productService.findAll();
      // La respuesta ya no necesita ser anidada bajo `products` si `findAll` devuelve el array directamente.
      return products; // O { message: 'Productos obtenidos exitosamente', data: products };
    } catch (error) {
      throw new HttpException(
        error.message || 'Error al obtener los productos',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Endpoint para obtener productos sin stock
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

  // Endpoint para obtener productos con bajo stock
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

  // Endpoint para obtener productos en oferta
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

  // Endpoint para obtener productos nuevos
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

  // Endpoint para obtener un producto por ID
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
    FilesInterceptor('files', 10, { // 'files' es el nombre del campo para las imágenes
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(process.cwd(), 'src', 'uploads', 'products'); // Carpeta específica para productos
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
      // Puedes añadir fileFilter aquí si es necesario
    }),
  )
  async createProduct(
    @Body() body: any, // Usamos 'any' porque multipart/form-data puede enviar todo como string
    @UploadedFiles() files: Array<Express.Multer.File>, // Cambiado a Array<Express.Multer.File>
  ) {
    let parsedVolumeDiscounts = [];
    if (body.volumeDiscounts) {
      try {
        parsedVolumeDiscounts = typeof body.volumeDiscounts === 'string'
          ? JSON.parse(body.volumeDiscounts)
          : body.volumeDiscounts;
        if (!Array.isArray(parsedVolumeDiscounts)) throw new Error();
      } catch (e) {
        throw new BadRequestException('Formato inválido para volumeDiscounts. Debe ser un array JSON.');
      }
    }

    let parsedBoxConfigurations = [];
    if (body.boxConfigurations) {
      try {
        parsedBoxConfigurations = typeof body.boxConfigurations === 'string'
          ? JSON.parse(body.boxConfigurations)
          : body.boxConfigurations;
        if (!Array.isArray(parsedBoxConfigurations)) throw new Error();
      } catch (e) {
        throw new BadRequestException('Formato inválido para boxConfigurations. Debe ser un array JSON.');
      }
    }
    
    // Construir el DTO
    const createProductDto: CreateProductDto = {
        name: body.name,
        description: body.description,
        price: parseFloat(body.price),
        code: body.code,
        barcode: body.barcode,
        shippingInfo: body.shippingInfo,
        brand: body.brand,
        cost: parseFloat(body.cost),
        margin: parseFloat(body.margin),
        tax: parseFloat(body.tax),
        weightKg: parseFloat(body.weightKg),
        unitsPerBox: parseInt(body.unitsPerBox, 10),
        unitsPerBulk: parseInt(body.unitsPerBulk, 10),
        onOffer: body.onOffer === 'true' || body.onOffer === true,
        isNew: body.isNew === 'true' || body.isNew === true,
        supplierProductCode: body.supplierProductCode,
        subcategoryId: body.subcategoryId,
        supplierId: parseInt(body.supplierId, 10),
        storeId: body.storeId, // Asumiendo que se envía para el stock inicial
        initialStock: parseInt(body.initialStock, 10) || 0,
        hidden: body.hidden === 'true' || body.hidden === true,
        wholesalePrice: body.wholesalePrice ? parseFloat(body.wholesalePrice) : undefined,
        minWholesaleQty: body.minWholesaleQty ? parseInt(body.minWholesaleQty, 10) : undefined,
        image: files && files.length > 0 ? files.map(file => `/uploads/products/${file.filename}`) : [], // Rutas relativas al prefijo de static assets
        volumeDiscounts: parsedVolumeDiscounts,
        boxConfigurations: parsedBoxConfigurations,
    };
    
    // Validar que los campos numéricos sean números válidos después de la conversión
    // (class-validator no actúa sobre `body: any` directamente, por eso las conversiones manuales)
    // Idealmente, se usaría un Pipe que transforme y valide el body correctamente incluso con multipart.

    try {
      const product = await this.productService.createProduct(createProductDto);
      return {
        success: true,
        message: 'Producto creado exitosamente',
        data: product,
      };
    } catch (error) {
      // Limpieza de archivos si la creación del producto falla
      if (files && files.length > 0) {
        for (const file of files) {
          const filePath = join(process.cwd(), 'src', 'uploads', 'products', file.filename);
          if (existsSync(filePath)) {
            try {
                await fsPromises.unlink(filePath);
            } catch (unlinkError) {
                console.error("Error al eliminar archivo subido tras fallo:", unlinkError);
            }
          }
        }
      }
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Error al crear el producto',
          error: error.response || error.message
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('store/:storeId')
  async getProductsByStore(@Param('storeId') storeId: string) {
    try {
      const products = await this.productService.findProductsByStore(storeId);
      return products; // O { success: true, message: 'Productos obtenidos exitosamente', data: products };
    } catch (error) {
      console.error('Error en el controlador (getProductsByStore):', error);
      throw new HttpException(
        error.message || 'Error al obtener los productos de la sucursal',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Actualizar un producto. Asumimos que el payload es application/json.
  // Si también necesitas subir imágenes aquí, el enfoque sería similar a createProduct con FilesInterceptor.
  @Put(':id')
  async updateProduct(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto, // UpdateProductDto debe estar bien definido para recibir los arrays
  ) {
    try {
      // Si updateProductDto puede venir de multipart/form-data (si permites actualizar imágenes aquí),
      // necesitarías parsear volumeDiscounts y boxConfigurations como en createProduct.
      // Si es application/json, NestJS y class-transformer/class-validator se encargan si el DTO está bien tipado.
      const updatedProduct = await this.productService.updateProduct(id, updateProductDto);
      return { message: 'Producto actualizado exitosamente', data: updatedProduct };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Error al actualizar el producto',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
async deleteProduct(@Param('id') id: string) {
  try {
    const result = await this.productService.deleteProduct(id);

    // Verificar si el resultado tiene la propiedad 'message'
    if (result && typeof (result as any).message === 'string') {
      return {
        success: true,
        message: (result as any).message, // Castear a any temporalmente si TS se queja
      };
    } else {
      return {
        success: true,
        message: 'Producto eliminado exitosamente',
        data: result, // Aquí result es de tipo Product
      };
    }
  } catch (error) {
    if (error instanceof NotFoundException) {
      throw error;
    }
    // ... tu manejo de HttpException ...
    throw new HttpException(
      {
        success: false,
        message: error.message || 'Error al eliminar el producto',
        error: error.response || error.message
      },
      error.status || HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
  
  // Endpoint para ocultar/mostrar producto
  @Put(':id/hide')
  async hideProduct(@Param('id') id: string, @Body('hidden') hidden: boolean) {
    if (typeof hidden !== 'boolean') {
      throw new BadRequestException('El campo "hidden" debe ser un valor booleano.');
    }
    try {
      const product = await this.productService.hideProduct(id, hidden);
      return { message: `Producto ${hidden ? 'ocultado' : 'mostrado'} exitosamente`, data: product };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Error al actualizar la visibilidad del producto',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}