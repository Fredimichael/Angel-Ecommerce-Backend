import { Controller, Post, Body, Get, Delete, Param } from '@nestjs/common';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';

@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Get()
  async getStores() {
    return await this.storesService.getStores();
  }

  @Post()
  async createStore(@Body() createStoreDto: CreateStoreDto) {
    return this.storesService.createStore(createStoreDto);
  }

  @Post('transfer')
  async transferProduct(
    @Body('fromStoreId') fromStoreId: string,
    @Body('toStoreId') toStoreId: string,
    @Body('productId') productId: string,
    @Body('quantity') quantity: number,
  ) {
    return await this.storesService.transferProduct(fromStoreId, toStoreId, productId, quantity);
  }

  @Delete(':id')
  async deleteStore(@Param('id') id: string) {
    return this.storesService.deleteStore(id);
  }
}
