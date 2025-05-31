import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { Product, StoreProduct } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateProductDto } from './dto/create-product.dto';


@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,             
  ) {}

  // Obtener todos los productos
  async findAll(): Promise<any[]> {
    const products = await this.prisma.product.findMany({
      include: {
        storeStock: {
          include: {
            store: true, // Incluir la sucursal asociada
          },
        },
      },
    });
  
    return products.map((product) => ({
      ...product,
      stores: product.storeStock.map((storeProduct) => ({
        id: storeProduct.store.id,
        name: storeProduct.store.name,
        address: storeProduct.store.address,
        quantity: storeProduct.quantity,
      })),
    }));
  }

  // Obtener un producto por ID
  async findById(id: string): Promise<Product> {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('El producto no existe.');
    }

    return product;
  }

  // Obtener productos por categoría y subcategoría
  async findByCategoryAndSubcategory(categoryId: string, subcategoryId: string): Promise<Product[]> {
    const subcategory = await this.prisma.subcategory.findUnique({
      where: { id: subcategoryId },
      include: { category: true },
    });

    if (!subcategory) {
      throw new NotFoundException('La subcategoría no existe.');
    }

    if (subcategory.category.id !== categoryId) {
      throw new BadRequestException('La subcategoría no pertenece a la categoría proporcionada.');
    }

    return this.prisma.product.findMany({
      where: { subcategoryId },
    });
  }

  // Obtener un producto por categoría, subcategoría e ID de producto
  async findProductByCategorySubcategoryAndId(
    categoryId: string,
    subcategoryId: string,
    productId: string,
  ): Promise<Product> {
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        subcategoryId,
        subcategory: {
          categoryId,
        },
      },
      include: {
        subcategory: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('El producto no existe o no pertenece a la categoría y subcategoría proporcionadas.');
    }

    return product;
  }

  // Obtener productos en oferta
  async findProductsOnOffer(): Promise<Product[]> {
    return this.prisma.product.findMany({
      where: { onOffer: true },
    });
  }

  // Obtener productos nuevos
  async findNewProducts(): Promise<Product[]> {
    return this.prisma.product.findMany({
      where: { isNew: true },
      include: {
        subcategory: {
          include: { category: true },
        },
      },
    });
  }

  // Obtener productos con bajo stock (menos de 10 unidades)
  async findLowStockProducts(): Promise<Product[]> {
    return this.prisma.product.findMany({
      where: {
        stock: {
          gt: 0,
          lte: 10,
        },
      },
      include: {
        subcategory: {
          include: { category: true },
        },
      },
    });
  }

  // Obtener productos sin stock
  async findOutOfStockProducts(): Promise<Product[]> {
    return this.prisma.product.findMany({
      where: {
        stock: 0,
      },
      include: {
        subcategory: {
          include: { category: true },
        },
      },
    });
  }

  // Método unificado para crear productos con imágenes
  async createProduct(createProductDto: CreateProductDto): Promise<Product> {
    try {
      const store = await this.prisma.store.findUnique({
        where: { id: createProductDto.storeId }
      });
      
      if (!store) {
        throw new BadRequestException(`La sucursal con ID ${createProductDto.storeId} no existe`);
      }
      

      return await this.prisma.$transaction(async (prisma) => {
        // Crear el producto con todos sus datos
        const newProduct = await prisma.product.create({
          data: {
            name: createProductDto.name,
            description: createProductDto.description,
            code: createProductDto.code,
            barcode: createProductDto.barcode,
            shippingInfo: createProductDto.shippingInfo,
            brand: createProductDto.brand,
            price: Number(createProductDto.price),
            cost: Number(createProductDto.cost),
            margin: Number(createProductDto.margin),
            tax: Number(createProductDto.tax),
            weightKg: Number(createProductDto.weightKg),
            unitsPerBox: Number(createProductDto.unitsPerBox),
            unitsPerBulk: Number(createProductDto.unitsPerBulk),
            onOffer: Boolean(createProductDto.onOffer),
            isNew: Boolean(createProductDto.isNew),
            supplierProductCode: createProductDto.supplierProductCode,
            subcategoryId: createProductDto.subcategoryId,
            supplierId: Number(createProductDto.supplierId),
            image: createProductDto.image || [],
            stock: Number(createProductDto.initialStock),
            initialStock: Number(createProductDto.initialStock),
            wholesalePrice: createProductDto.wholesalePrice ? Number(createProductDto.wholesalePrice) : null,
            minWholesaleQty: createProductDto.minWholesaleQty ? Number(createProductDto.minWholesaleQty) : null,
            hidden: createProductDto.hidden || false,
          },
          include: {
            subcategory: true,
            supplier: true,
          },
        });

        // Crear la relación con la sucursal
        await prisma.storeProduct.create({
          data: {
            storeId: createProductDto.storeId,
            productId: newProduct.id,
            quantity: Number(createProductDto.initialStock),
          },
        });

        return newProduct;
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error.code === 'P2002') {
        throw new BadRequestException('El código o código de barras ya existe');
      }
      throw new InternalServerErrorException(`Error al crear el producto: ${error.message}`);
    }
  }

  // Método para actualizar un producto
  async updateProduct(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id },
      });

      if (!product) {
        throw new NotFoundException('El producto no existe.');
      }

      // Validar que subcategoryId existe si se proporciona
      if (updateProductDto.subcategoryId) {
        const subcategory = await this.prisma.subcategory.findUnique({
          where: { id: updateProductDto.subcategoryId },
        });

        if (!subcategory) {
          throw new NotFoundException('La subcategoría no existe');
        }
      }

      // Validar que supplierId existe si se proporciona
      if (updateProductDto.supplierId) {
        const supplier = await this.prisma.supplier.findUnique({
          where: { id: updateProductDto.supplierId },
        });

        if (!supplier) {
          throw new NotFoundException('El proveedor no existe');
        }
      }

      // Convertir los campos necesarios a números
      const updateData = {
        ...updateProductDto,
        supplierId: updateProductDto.supplierId ? Number(updateProductDto.supplierId) : undefined,
      };

      return await this.prisma.product.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      console.error('Error detallado:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error al actualizar el producto: ${error.message}`);
    }
  }

  // Método para eliminar un producto
  async deleteProduct(id: string, storeId?: string): Promise<Product | { message: string }> {
    try {
      if (storeId) {
        // Verificar si existe la relación entre el producto y la sucursal
        const storeProduct = await this.prisma.storeProduct.findFirst({
          where: {
            productId: id,
            storeId: storeId,
          },
        });

        if (!storeProduct) {
          throw new NotFoundException(
            `El producto con ID ${id} no está asociado a la sucursal con ID ${storeId}`
          );
        }

        // Eliminar la relación entre el producto y la sucursal
        await this.prisma.storeProduct.deleteMany({
          where: {
            productId: id,
            storeId: storeId,
          },
        });

        return { message: `El producto fue eliminado de la sucursal con ID ${storeId}` };
      }

      // Desconectar el producto de los enlaces mayoristas
      const wholesaleLinks = await this.prisma.wholesaleLink.findMany({
        where: {
          products: {
            some: { id },
          },
        },
      });

      for (const link of wholesaleLinks) {
        await this.prisma.wholesaleLink.update({
          where: { id: link.id },
          data: {
            products: {
              disconnect: { id },
            },
          },
        });
      }

      // Eliminar todas las relaciones asociadas al producto
      await this.prisma.$transaction([
        this.prisma.storeProduct.deleteMany({
          where: { productId: id },
        }),
        this.prisma.orderItem.deleteMany({
          where: { productId: id },
        }),
        this.prisma.stockTransfer.deleteMany({
          where: { productId: id },
        }),
        // Agregar aquí otras relaciones que dependan del producto si aplica
      ]);

      // Eliminar el producto globalmente
      const deletedProduct = await this.prisma.product.delete({
        where: { id },
      });

      return deletedProduct;
    } catch (error) {
      console.error('Error al eliminar el producto:', error);
      if (error.code === 'P2025') {
        throw new NotFoundException(`Producto con ID ${id} no encontrado`);
      }
      throw new InternalServerErrorException(
        `No se pudo eliminar el producto: ${error.message}`
      );
    }
  }

  // Ocultar un producto
  async hideProduct(id: string, hidden: boolean): Promise<Product> {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('El producto no existe.');
    }
    return this.prisma.product.update({
      where: { id },
      data: { hidden },
    });
  }

  // Metodo para filtrar productos por sucursal
  async findProductsByStore(storeId: string): Promise<any[]> {
    try {
      
      const storeProducts = await this.prisma.storeProduct.findMany({
        where: { 
          storeId 
        },
        include: {
          product: {
            include: {
              subcategory: true,
              supplier: true,
            }
          },
          store: true,
        },
      });

      // Transformar los datos para el frontend
      const formattedProducts = storeProducts.map((sp) => ({
        ...sp.product,
        quantity: sp.quantity,
        store: {
          id: sp.store.id,
          name: sp.store.name,
          address: sp.store.address,
        }
      }));

      return formattedProducts;
    } catch (error) {
      console.error('Error al buscar productos por sucursal:', error);
      throw error;
    }
  }

}