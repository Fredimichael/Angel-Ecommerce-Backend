import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../prisma/prisma.service'; // Ajusta la ruta según tu estructura

@Injectable()
export class WholesaleMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const token = req.query.wholesaleToken as string;
    
    if (token) {
      const link = await this.prisma.wholesaleLink.findUnique({
        where: { token },
        include: { products: true },
      });
      
      if (link && link.isActive && (!link.expiresAt || link.expiresAt > new Date())) {
        req['wholesale'] = link; // Inyecta el contexto mayorista en la request
        // Opcional: Actualizar contador de usos
        await this.prisma.wholesaleLink.update({
          where: { id: link.id },
          data: { 
            uses: { increment: 1 },
            lastUsedAt: new Date(),
          },
        });
      }
    }
    next();
  }
}