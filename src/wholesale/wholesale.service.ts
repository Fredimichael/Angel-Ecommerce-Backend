import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
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
                products: {
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

        await this.prisma.wholesaleLink.update({
            where: { id: link.id },
            data: {
                uses: { increment: 1 },
                lastUsedAt: new Date(),
            },
        });

        return link;
    }

    async applyWholesalePricing(products: any[], wholesaleToken?: string) {
        if (!wholesaleToken) return products;

        const wholesaleData = await this.validateToken(wholesaleToken);
        if (!wholesaleData) return products;

        return products.map(product => {
            const wholesaleProduct = wholesaleData.products.find(p => p.id === product.id);
            
            let price = product.price;
            let isWholesale = false;

            if (wholesaleProduct) {
                price = wholesaleProduct.wholesalePrice || product.price;
                isWholesale = true;
            } else if (wholesaleData.discount > 0) {
                price = product.price * (1 - wholesaleData.discount / 100);
                isWholesale = true;
            }

            return {
                ...product,
                price: Number(price.toFixed(2)),
                originalPrice: product.price,
                isWholesale,
                minWholesaleQty: wholesaleProduct?.minWholesaleQty,
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
            where.OR = [
                { expiresAt: null },
                { expiresAt: { gt: new Date() } }
            ];
        }
    
        if (searchTerm) {
            where.OR = [
                ...(where.OR || []),
                { name: { contains: searchTerm, mode: 'insensitive' } },
                { customerName: { contains: searchTerm, mode: 'insensitive' } },
                { customerEmail: { contains: searchTerm, mode: 'insensitive' } },
                { businessName: { contains: searchTerm, mode: 'insensitive' } },
                { token: { contains: searchTerm, mode: 'insensitive' } },
            ];
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

        const products = await this.prisma.product.findMany({
            where: {
                OR: [
                    { wholesaleLinks: { some: { token } } },
                    { wholesalePrice: { not: null } }
                ],
                hidden: false
            },
            include: {
                subcategory: true,
                supplier: true
            }
        });

        return this.applyWholesalePricing(products, token);
    }

    async deleteLink(id: string) {
        return this.prisma.wholesaleLink.delete({
            where: { id },
        });
    }
}