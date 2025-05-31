
import { IsString, IsArray, ValidateNested, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

class ProductTransferItem {
  @IsString()
  productId: string;

  @IsInt()
  @Min(1) // Reintroducido @Min(1)
  quantity: number;
}

export class TransferStockDto {
  @IsString()
  fromStoreId: string;

  @IsString()
  toStoreId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductTransferItem)
  products: ProductTransferItem[];
}