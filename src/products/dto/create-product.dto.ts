import { IsString, IsNumber, IsArray, IsBoolean, IsOptional } from 'class-validator';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsString()
  code: string;

  @IsString()
  barcode: string;

  @IsString()
  shippingInfo: string;

  @IsString()
  brand: string;

  @IsNumber()
  price: number;

  @IsNumber()
  cost: number;

  @IsNumber()
  margin: number;

  @IsNumber()
  tax: number;

  @IsNumber()
  weightKg: number;

  @IsNumber()
  unitsPerBox: number;

  @IsNumber()
  unitsPerBulk: number;

  @IsBoolean()
  onOffer: boolean;

  @IsBoolean()
  isNew: boolean;

  @IsString()
  @IsOptional()
  supplierProductCode?: string;

  @IsString()
  subcategoryId: string;

  @IsNumber()
  supplierId: number;

  @IsString()
  storeId: string;

  @IsNumber()
  initialStock: number;

  @IsArray()
  @IsOptional()
  image?: string[];

  @IsNumber()
  @IsOptional()
  wholesalePrice?: number;

  @IsNumber()
  @IsOptional()
  minWholesaleQty?: number;

  @IsBoolean()
  @IsOptional()
  hidden?: boolean;
}