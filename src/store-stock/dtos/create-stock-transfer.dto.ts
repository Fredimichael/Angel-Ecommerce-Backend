import { IsString, IsNumber, IsNotEmpty } from 'class-validator';

export class CreateStockTransferDto {
  @IsString()
  @IsNotEmpty()
  fromStoreId: string;

  @IsString()
  @IsNotEmpty()
  toStoreId: string;

  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @IsNotEmpty()
  quantity: number;
}