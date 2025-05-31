import { Controller, Get, Patch, Post, Body, Param } from '@nestjs/common';
import { StoreStockService } from './store-stock.service';
import { UpdateStockDto } from './dtos/update-stock.dto';
import { TransferStockDto } from './dtos/transfer-stock.dto';

@Controller('store-stock')
export class StoreStockController {
  constructor(private readonly storeStockService: StoreStockService) {}

  @Get(':storeId/:productId')
  async getProductStock(@Param('storeId') storeId: string, @Param('productId') productId: string) {
    return await this.storeStockService.getProductStock(storeId, productId);
  }

  @Get(':storeId')
  async getStoreProducts(@Param('storeId') storeId: string) {
    return await this.storeStockService.getStoreProducts(storeId);
  }

  @Patch('update')
  async updateProductStock(@Body() updateStockDto: UpdateStockDto) {
    return await this.storeStockService.updateProductStock(updateStockDto);
  }

  @Post('transfer')
  async transferStock(@Body() transferStockDto: TransferStockDto) {
    return await this.storeStockService.transferStock(transferStockDto);
  }

  @Get('transfers/history')
  async getStockTransfers() {
    return await this.storeStockService.getStockTransfers();
  }
}
