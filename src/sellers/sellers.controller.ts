import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { SellersService } from './sellers.service';

@Controller('sellers') // Ruta base: /sellers
export class SellersController {
  constructor(private readonly sellersService: SellersService) {}

  // Endpoint para crear un nuevo seller
  @Post()
  async createSeller(@Body() data: { name: string; email: string }) {
    return this.sellersService.createSeller(data);
  }

  // Endpoint para obtener todos los sellers
  @Get()
  async getAllSellers() {
    return this.sellersService.getAllSellers();
  }

  // Endpoint para obtener las órdenes de un vendedor específico
  @Get(':id/orders')
  async getOrdersBySeller(@Param('id') sellerId: string) {
    return this.sellersService.getOrdersBySeller(Number(sellerId));
  }
}
