// src/products/products.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Product } from '@prisma/client'; // Product type from Prisma
import { PrismaService } from '../../prisma/prisma.service'; // Ajusta la ruta si es necesario
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<any[]> {
    const products = await this.prisma.product.findMany({
      where: { hidden: false }, // No mostrar productos ocultos por defecto
      include: {
        storeStock: {
          include: {
            store: true,
          },
        },
        subcategory: { include: { category: true } },
        supplier: true,
        volumeDiscounts: { orderBy: { minQuantity: 'asc' } },
        boxConfigurations: { where: { isActive: true }, orderBy: { quantityInBox: 'asc' } },
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

  async findById(id: string): Promise<Product | null> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        subcategory: { include: { category: true } },
        supplier: true,
        storeStock: { include: { store: true } },
        volumeDiscounts: { orderBy: { minQuantity: 'asc' } },
        boxConfigurations: { where: { isActive: true }, orderBy: { quantityInBox: 'asc' } },
      },
    });

    if (!product) {
      throw new NotFoundException('El producto no existe.');
    }
    // Puedes mapear el producto aquí si es necesario, similar a findAll
    return product;
  }

  async findByCategoryAndSubcategory(categoryId: string, subcategoryId: string): Promise<Product[]> {
    // ... (lógica existente)
    return this.prisma.product.findMany({
      where: { subcategoryId, subcategory: { categoryId: categoryId }, hidden: false },
      include: {
        volumeDiscounts: { orderBy: { minQuantity: 'asc' } },
        boxConfigurations: { where: { isActive: true }, orderBy: { quantityInBox: 'asc' } },
        subcategory: { include: { category: true } },
        supplier: true,
      },
    });
  }
  
  async findProductByCategorySubcategoryAndId(
    categoryId: string,
    subcategoryId: string,
    productId: string,
  ): Promise<Product> {
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        subcategoryId,
        subcategory: { categoryId },
        hidden: false,
      },
      include: {
        volumeDiscounts: { orderBy: { minQuantity: 'asc' } },
        boxConfigurations: { where: { isActive: true }, orderBy: { quantityInBox: 'asc' } },
        subcategory: { include: { category: true }},
        supplier: true,
      },
    });

    if (!product) {
      throw new NotFoundException('El producto no existe o no pertenece a la categoría y subcategoría proporcionadas.');
    }
    return product;
  }

  async findProductsOnOffer(): Promise<Product[]> {
    return this.prisma.product.findMany({
      where: { onOffer: true, hidden: false },
      include: {
        volumeDiscounts: { orderBy: { minQuantity: 'asc' } },
        boxConfigurations: { where: { isActive: true }, orderBy: { quantityInBox: 'asc' } },
        subcategory: { include: { category: true } },
        supplier: true,
      },
    });
  }

  async findNewProducts(): Promise<Product[]> {
    return this.prisma.product.findMany({
      where: { isNew: true, hidden: false },
      include: {
        volumeDiscounts: { orderBy: { minQuantity: 'asc' } },
        boxConfigurations: { where: { isActive: true }, orderBy: { quantityInBox: 'asc' } },
        subcategory: { include: { category: true } },
        supplier: true,
      },
    });
  }
  
  async findLowStockProducts(): Promise<Product[]> {
    return this.prisma.product.findMany({
      where: {
        stock: { gt: 0, lte: 10 },
        hidden: false,
      },
      include: {
        volumeDiscounts: { orderBy: { minQuantity: 'asc' } },
        boxConfigurations: { where: { isActive: true }, orderBy: { quantityInBox: 'asc' } },
        subcategory: { include: { category: true } },
        supplier: true,
      },
    });
  }

  async findOutOfStockProducts(): Promise<Product[]> {
    return this.prisma.product.findMany({
      where: { stock: 0, hidden: false },
      include: {
        volumeDiscounts: { orderBy: { minQuantity: 'asc' } },
        boxConfigurations: { where: { isActive: true }, orderBy: { quantityInBox: 'asc' } },
        subcategory: { include: { category: true } },
        supplier: true,
      },
    });
  }

  async createProduct(createProductDto: CreateProductDto): Promise<Product> {
    const {
      volumeDiscounts,
      boxConfigurations,
      storeId,
      initialStock, // Este es el stock para la tienda especificada o el stock global inicial
      // Separar el resto de los datos del producto
      name, description, image, price, wholesalePrice, minWholesaleQty, onOffer, isNew,
      code, barcode, shippingInfo, cost, margin, tax, brand, weightKg, unitsPerBox,
      unitsPerBulk, subcategoryId, supplierProductCode, supplierId, hidden
    } = createProductDto;

    // Preparar datos del producto principal, convirtiendo tipos si es necesario
    const productMainData = {
      name, description, image: image || [],
      price: Number(price),
      wholesalePrice: wholesalePrice != null ? Number(wholesalePrice) : null,
      minWholesaleQty: minWholesaleQty != null ? Number(minWholesaleQty) : null,
      onOffer: Boolean(onOffer),
      isNew: Boolean(isNew),
      code, barcode, shippingInfo,
      cost: Number(cost),
      margin: Number(margin),
      tax: Number(tax),
      brand,
      weightKg: Number(weightKg),
      unitsPerBox: Number(unitsPerBox),
      unitsPerBulk: Number(unitsPerBulk),
      subcategoryId, supplierProductCode,
      supplierId: Number(supplierId),
      hidden: Boolean(hidden),
      stock: Number(initialStock) || 0, // Stock global inicial
      initialStock: Number(initialStock) || 0, // También como referencia del stock "comprado"
    };

    try {
      if (storeId) {
        const store = await this.prisma.store.findUnique({ where: { id: storeId } });
        if (!store) {
          throw new BadRequestException(`La sucursal con ID ${storeId} no existe.`);
        }
      }

      return await this.prisma.$transaction(async (prismaTx) => {
        const newProduct = await prismaTx.product.create({
          data: {
            ...productMainData,
            volumeDiscounts: volumeDiscounts && volumeDiscounts.length > 0
              ? {
                  create: volumeDiscounts.map(vd => ({
                    minQuantity: Number(vd.minQuantity),
                    discountPercentage: Number(vd.discountPercentage),
                  })),
                }
              : undefined,
            boxConfigurations: boxConfigurations && boxConfigurations.length > 0
              ? {
                  create: boxConfigurations.map(bc => ({
                    name: bc.name,
                    quantityInBox: Number(bc.quantityInBox),
                    totalBoxPrice: Number(bc.totalBoxPrice),
                    sku: bc.sku,
                    isActive: bc.isActive !== undefined ? Boolean(bc.isActive) : true,
                  })),
                }
              : undefined,
          },
          include: {
            volumeDiscounts: true,
            boxConfigurations: true,
            subcategory: true,
            supplier: true,
          },
        });

        if (storeId && initialStock > 0) {
          await prismaTx.storeProduct.create({
            data: {
              storeId: storeId,
              productId: newProduct.id,
              quantity: Number(initialStock),
            },
          });
        }
        return newProduct;
      });
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      if (error.code === 'P2002') { // Unique constraint failed
        // Identificar qué campo causó el error (code, barcode, o SKUs en boxConfigs)
        // Por ahora, un mensaje genérico. Idealmente, se podría refinar este mensaje.
        throw new BadRequestException('Error de constraint único. El código, código de barras o SKU de caja ya existe.');
      }
      console.error('Error al crear el producto:', error);
      throw new InternalServerErrorException(`Error al crear el producto: ${error.message}`);
    }
  }

  async updateProduct(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const {
      volumeDiscounts,
      boxConfigurations,
      // Separar el resto de los datos del producto
      name, description, image, price, wholesalePrice, minWholesaleQty, onOffer, isNew,
      code, barcode, shippingInfo, cost, margin, tax, brand, weightKg, unitsPerBox,
      unitsPerBulk, subcategoryId, supplierProductCode, supplierId, hidden, stock, initialStock
      // No incluimos storeId aquí, la actualización de stock por tienda se maneja en StoreStockService
    } = updateProductDto;
    
    const productUpdatePayload: any = {};

    // Construir payload solo con campos definidos para evitar sobreescribir con undefined
    if (name !== undefined) productUpdatePayload.name = name;
    if (description !== undefined) productUpdatePayload.description = description;
    if (image !== undefined) productUpdatePayload.image = image;
    if (price !== undefined) productUpdatePayload.price = Number(price);
    if (wholesalePrice !== undefined) productUpdatePayload.wholesalePrice = wholesalePrice != null ? Number(wholesalePrice) : null;
    if (minWholesaleQty !== undefined) productUpdatePayload.minWholesaleQty = minWholesaleQty != null ? Number(minWholesaleQty) : null;
    if (onOffer !== undefined) productUpdatePayload.onOffer = Boolean(onOffer);
    if (isNew !== undefined) productUpdatePayload.isNew = Boolean(isNew);
    if (code !== undefined) productUpdatePayload.code = code;
    if (barcode !== undefined) productUpdatePayload.barcode = barcode;
    if (shippingInfo !== undefined) productUpdatePayload.shippingInfo = shippingInfo;
    if (cost !== undefined) productUpdatePayload.cost = Number(cost);
    if (margin !== undefined) productUpdatePayload.margin = Number(margin);
    if (tax !== undefined) productUpdatePayload.tax = Number(tax);
    if (brand !== undefined) productUpdatePayload.brand = brand;
    if (weightKg !== undefined) productUpdatePayload.weightKg = Number(weightKg);
    if (unitsPerBox !== undefined) productUpdatePayload.unitsPerBox = Number(unitsPerBox);
    if (unitsPerBulk !== undefined) productUpdatePayload.unitsPerBulk = Number(unitsPerBulk);
    if (subcategoryId !== undefined) productUpdatePayload.subcategoryId = subcategoryId;
    if (supplierProductCode !== undefined) productUpdatePayload.supplierProductCode = supplierProductCode;
    if (supplierId !== undefined) productUpdatePayload.supplierId = Number(supplierId);
    if (hidden !== undefined) productUpdatePayload.hidden = Boolean(hidden);
    if (stock !== undefined) productUpdatePayload.stock = Number(stock); // Stock global
    if (initialStock !== undefined) productUpdatePayload.initialStock = Number(initialStock);


    try {
      const existingProduct = await this.prisma.product.findUnique({ where: { id } });
      if (!existingProduct) {
        throw new NotFoundException(`Producto con ID ${id} no encontrado.`);
      }

      return await this.prisma.$transaction(async (prismaTx) => {
        // Eliminar y recrear descuentos y configuraciones de caja
        if (volumeDiscounts !== undefined) { // Solo modificar si se envían en el DTO
          await prismaTx.productVolumeDiscount.deleteMany({ where: { productId: id } });
          if (volumeDiscounts.length > 0) {
            productUpdatePayload.volumeDiscounts = {
              create: volumeDiscounts.map(vd => ({
                minQuantity: Number(vd.minQuantity),
                discountPercentage: Number(vd.discountPercentage),
              })),
            };
          }
        }

        if (boxConfigurations !== undefined) { // Solo modificar si se envían en el DTO
          await prismaTx.productBoxConfig.deleteMany({ where: { productId: id } });
          if (boxConfigurations.length > 0) {
            productUpdatePayload.boxConfigurations = {
              create: boxConfigurations.map(bc => ({
                name: bc.name,
                quantityInBox: Number(bc.quantityInBox),
                totalBoxPrice: Number(bc.totalBoxPrice),
                sku: bc.sku,
                isActive: bc.isActive !== undefined ? Boolean(bc.isActive) : true,
              })),
            };
          }
        }
        
        const updatedProduct = await prismaTx.product.update({
          where: { id },
          data: productUpdatePayload,
          include: {
            volumeDiscounts: true,
            boxConfigurations: true,
            subcategory: true,
            supplier: true,
          },
        });
        return updatedProduct;
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      if (error.code === 'P2002') {
         throw new BadRequestException('Error de constraint único. El código, código de barras o SKU de caja ya existe para otro producto.');
      }
      console.error('Error al actualizar el producto:', error);
      throw new InternalServerErrorException(`Error al actualizar el producto: ${error.message}`);
    }
  }

  async deleteProduct(id: string, storeId?: string): Promise<Product | { message: string }> {
    // La lógica de onDelete: Cascade en Prisma se encargará de ProductVolumeDiscount y ProductBoxConfig
    // Tu lógica existente para StoreProduct, OrderItem, etc., se mantiene.
    try {
      if (storeId) {
        // ... (tu lógica existente para eliminar de una sucursal específica)
        const storeProduct = await this.prisma.storeProduct.findFirst({
          where: { productId: id, storeId: storeId },
        });
        if (!storeProduct) {
          throw new NotFoundException(`El producto con ID ${id} no está asociado a la sucursal con ID ${storeId}`);
        }
        await this.prisma.storeProduct.deleteMany({
          where: { productId: id, storeId: storeId },
        });
        // Considera si esto debe afectar el stock global del producto
        return { message: `El producto fue eliminado de la sucursal con ID ${storeId}` };
      }

      // Desconectar el producto de los enlaces mayoristas
      const wholesaleLinks = await this.prisma.wholesaleLink.findMany({
        where: { products: { some: { id }}},
      });
      for (const link of wholesaleLinks) {
        await this.prisma.wholesaleLink.update({
          where: { id: link.id },
          data: { products: { disconnect: { id }}},
        });
      }

      // Eliminar otras relaciones (tu lógica existente)
      await this.prisma.$transaction([
        this.prisma.storeProduct.deleteMany({ where: { productId: id } }),
        this.prisma.orderItem.deleteMany({ where: { productId: id } }),
        this.prisma.stockTransfer.deleteMany({ where: { productId: id } }),
        // ProductVolumeDiscount y ProductBoxConfig se borran por onDelete: Cascade
      ]);

      const deletedProduct = await this.prisma.product.delete({ where: { id } });
      return deletedProduct;
    } catch (error) {
      if (error.code === 'P2025') { // Record to delete not found
        throw new NotFoundException(`Producto con ID ${id} no encontrado.`);
      }
      // Manejo de error P2003 (Foreign key constraint failed) si algo sigue referenciando al producto
      // que no se borró en la transacción (ej. si OrderItem no tuviera onDelete: Cascade o no se borrara antes)
      console.error('Error al eliminar el producto:', error);
      throw new InternalServerErrorException(`No se pudo eliminar el producto: ${error.message}`);
    }
  }

  async hideProduct(id: string, hidden: boolean): Promise<Product> {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('El producto no existe.');
    }
    return this.prisma.product.update({
      where: { id },
      data: { hidden },
      include: { // Devolver el producto completo con sus descuentos
        volumeDiscounts: { orderBy: { minQuantity: 'asc' } },
        boxConfigurations: { where: { isActive: true }, orderBy: { quantityInBox: 'asc' } },
      }
    });
  }

  async findProductsByStore(storeId: string): Promise<any[]> {
    try {
      const storeProducts = await this.prisma.storeProduct.findMany({
        where: { storeId },
        include: {
          product: {
            include: {
              subcategory: true,
              supplier: true,
              volumeDiscounts: { orderBy: { minQuantity: 'asc' } },
              boxConfigurations: { where: { isActive: true }, orderBy: { quantityInBox: 'asc' } },
            },
          },
          store: true,
        },
      });

      const formattedProducts = storeProducts.map((sp) => ({
        ...sp.product,
        quantity: sp.quantity, // Stock en esta tienda específica
        store: {
          id: sp.store.id,
          name: sp.store.name,
          address: sp.store.address,
        },
      }));
      return formattedProducts;
    } catch (error) {
      console.error('Error al buscar productos por sucursal:', error);
      throw new InternalServerErrorException('Error al buscar productos por sucursal.');
    }
  }
}