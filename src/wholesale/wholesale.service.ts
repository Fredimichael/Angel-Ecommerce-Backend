// Archivo: src/wholesale/wholesale.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service'; // Ajusta la ruta si es necesario
import * as crypto from 'crypto';

@Injectable()
export class WholesaleService {
    constructor(private prisma: PrismaService) {}

    async createLink(data: {
        name: string;
        discount?: number;
        expiresAt?: Date;
        businessName?: string;
        notes?: string;
        createdBy?: string;
        customSlug?: string;
    }) {
        const token = crypto.randomBytes(16).toString('hex');
        return this.prisma.wholesaleLink.create({
            data: {
                token,
                name: data.name,
                discount: data.discount || 0,
                expiresAt: data.expiresAt,
                businessName: data.businessName,
                notes: data.notes,
                createdBy: data.createdBy,
                customSlug: data.customSlug,
                isActive: true,
            },
        });
    }

    async validateToken(token: string) {
        const link = await this.prisma.wholesaleLink.findUnique({
            where: { token },
            include: { 
                products: { // Productos específicamente asociados al enlace (puede ser para curación de catálogo)
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        wholesalePrice: true,
                        minWholesaleQty: true,
                    }
                } 
            },
        });

        if (!link || !link.isActive) return null;
        if (link.expiresAt && new Date(link.expiresAt) < new Date()) return null;

        // Esta actualización de 'uses' se ejecuta cada vez que se valida el token.
        // Considera si este es el comportamiento deseado para cada cálculo de precios.
        await this.prisma.wholesaleLink.update({
            where: { id: link.id },
            data: {
                uses: { increment: 1 },
                lastUsedAt: new Date(),
            },
        });

        return link;
    }

    /**
     * Método MODIFICADO para aplicar precios mayoristas.
     *
     * @param products Array de productos (objetos completos del modelo Product).
     * @param wholesaleToken El token del enlace mayorista.
     */
    async applyWholesalePricing(products: any[], wholesaleToken?: string) {
        if (!wholesaleToken) {
            return products.map(p => ({
                ...p,
                originalPrice: p.price,
                isWholesale: false,
                // minWholesaleQty ya estaría en 'p' si existe y es relevante mostrarlo
            }));
        }

        const wholesaleData = await this.validateToken(wholesaleToken);
        if (!wholesaleData) {
            return products.map(p => ({
                ...p,
                originalPrice: p.price,
                isWholesale: false,
            }));
        }

        return products.map(product => {
            // Asumimos que 'product' tiene: product.price, product.wholesalePrice, product.minWholesaleQty
            let priceToApply = product.price; // Por defecto, el precio minorista
            let isWholesale = false;
            let effectiveMinWholesaleQty = null; // Cantidad mínima para el precio mayorista aplicado

            // 1. ¿Tiene el producto un `wholesalePrice` específico y válido?
            if (product.wholesalePrice != null && product.wholesalePrice > 0) {
                priceToApply = product.wholesalePrice;
                effectiveMinWholesaleQty = product.minWholesaleQty; // Usar la cant. mín. del producto para su precio mayorista
                isWholesale = true;
            }
            // 2. Si no, ¿tiene el Enlace Mayorista un descuento general aplicable?
            else if (wholesaleData.discount > 0) {
                priceToApply = product.price * (1 - wholesaleData.discount / 100);
                isWholesale = true;
                // El descuento del enlace generalmente aplica desde la primera unidad.
                // Si hubiera una cantidad mínima específica para el descuento del *enlace*, se usaría aquí.
                effectiveMinWholesaleQty = 1; // Indicando que el descuento del enlace aplica desde 1 unidad.
            }
            // 3. Si ninguna de las anteriores, se mantiene el precio minorista y isWholesale = false.

            return {
                ...product,
                price: Number(priceToApply.toFixed(2)),
                originalPrice: product.price, // Siempre mostrar el precio minorista original como referencia
                isWholesale,
                minWholesaleQty: effectiveMinWholesaleQty,
            };
        });
    }

    async saveCustomerData(data: {
        token: string;
        name: string;
        email: string;
        phone: string;
        address?: string;
        businessName?: string;
        taxId?: string;
    }) {
        return this.prisma.wholesaleLink.update({
            where: { token: data.token },
            data: {
                customerName: data.name,
                customerEmail: data.email,
                customerPhone: data.phone,
                customerAddress: data.address,
                businessName: data.businessName,
                taxId: data.taxId,
            },
        });
    }

    async getAllLinks(options: { 
        activeOnly?: boolean; 
        searchTerm?: string 
    } = {}) {
        const { activeOnly = true, searchTerm } = options;
    
        const where: any = {};
        
        if (activeOnly) {
            where.isActive = true;
            where.OR = [ // Este OR es para la condición de activeOnly
                { expiresAt: null },
                { expiresAt: { gt: new Date() } }
            ];
        }
    
        if (searchTerm) {
            const searchConditions = [
                { name: { contains: searchTerm, mode: 'insensitive' } },
                { customerName: { contains: searchTerm, mode: 'insensitive' } },
                { customerEmail: { contains: searchTerm, mode: 'insensitive' } },
                { businessName: { contains: searchTerm, mode: 'insensitive' } },
                { token: { contains: searchTerm, mode: 'insensitive' } },
            ];

            if (where.OR) { // Si ya existe un OR de activeOnly
                 // Necesitamos que se cumplan las condiciones de active Y las de búsqueda
                 where.AND = [
                     { OR: where.OR }, // Mantenemos el OR original para activeOnly
                     { OR: searchConditions } // Añadimos un nuevo OR para las condiciones de búsqueda
                 ];
                 delete where.OR; // Eliminamos el OR de nivel superior para evitar conflictos
            } else { // Si no había condiciones de activeOnly, solo aplicamos el OR de búsqueda
                where.OR = searchConditions;
            }
        }
    
        return this.prisma.wholesaleLink.findMany({
            where,
            select: {
                id: true,
                token: true,
                name: true,
                discount: true,
                expiresAt: true,
                isActive: true,
                uses: true,
                lastUsedAt: true,
                customerName: true,
                customerEmail: true,
                businessName: true,
                createdAt: true,
                notes: true,
                customSlug: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async getCustomerData(token: string) {
        return this.prisma.wholesaleLink.findUnique({
            where: { token },
            select: {
                customerName: true,
                customerEmail: true,
                customerPhone: true,
                customerAddress: true,
                businessName: true,
                taxId: true,
                discount: true,
            },
        });
    }

    async getWholesaleProducts(token: string) {
        const wholesaleData = await this.validateToken(token);
        if (!wholesaleData) return null;

        // La forma en que se obtienen los productos aquí determinará a qué productos
        // se les aplicará la lógica de applyWholesalePricing.
        // Tu lógica actual obtiene productos vinculados al token O productos que tengan un wholesalePrice.
        // Si quieres que el enlace aplique a TODOS los productos (no ocultos),
        // el `where` aquí debería ser más simple, ej: `{ hidden: false }`.
        const products = await this.prisma.product.findMany({
            where: {
                OR: [
                    { wholesaleLinks: { some: { token } } }, // Productos vinculados a ESTE enlace
                    { wholesalePrice: { not: null } }        // O CUALQUIER producto con un precio mayorista global
                ],
                hidden: false // Excluir productos ocultos
            },
            include: {
                subcategory: true,
                supplier: true
                // No es necesario `wholesaleLinks` aquí si ya filtramos por token.
            }
        });
        // Los 'products' aquí son instancias completas del modelo Product,
        // por lo que tendrán product.price, product.wholesalePrice, product.minWholesaleQty.
        return this.applyWholesalePricing(products, token);
    }

    async deleteLink(id: string) {
        return this.prisma.wholesaleLink.delete({
            where: { id },
        });
    }
}