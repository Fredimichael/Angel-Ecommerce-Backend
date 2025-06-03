import { IsString, IsNumber, IsArray, IsBoolean, IsOptional, ValidateNested, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateProductVolumeDiscountDto } from './create-product-volume-discount.dto'; // Asegúrate que la ruta sea correcta
import { CreateProductBoxConfigDto } from './create-product-box-config.dto';     // Asegúrate que la ruta sea correcta

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  price: number; // Precio base por unidad

  // ... otros campos existentes de Product (code, barcode, stock, subcategoryId, etc.)
  @IsString()
  code: string;

  @IsString()
  barcode: string;

  @IsString()
  shippingInfo: string;

  @IsString()
  brand: string;

  @IsNumber()
  cost: number;

  @IsNumber()
  margin: number;

  @IsNumber()
  tax: number;

  @IsNumber()
  weightKg: number;

  @IsNumber()
  @IsInt()
  unitsPerBox: number;

  @IsNumber()
  @IsInt()
  unitsPerBulk: number;

  @IsBoolean()
  @IsOptional()
  onOffer?: boolean = false;

  @IsBoolean()
  @IsOptional()
  isNew?: boolean = false;

  @IsString()
  @IsOptional()
  supplierProductCode?: string;

  @IsString()
  subcategoryId: string;

  @IsNumber()
  @IsInt()
  supplierId: number;

  @IsString() // Asumiendo que el storeId se sigue enviando para el stock inicial en una tienda
  storeId: string;

  @IsNumber()
  @IsInt()
  @Min(0)
  initialStock: number;

  @IsArray()
  @IsOptional()
  image?: string[];

  @IsNumber()
  @IsOptional()
  @Min(0)
  wholesalePrice?: number;

  @IsNumber()
  @IsInt()
  @IsOptional()
  @Min(1)
  minWholesaleQty?: number;

  @IsBoolean()
  @IsOptional()
  hidden?: boolean = false;


  // --- NUEVOS CAMPOS PARA DESCUENTOS ---
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductVolumeDiscountDto)
  volumeDiscounts?: CreateProductVolumeDiscountDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductBoxConfigDto)
  boxConfigurations?: CreateProductBoxConfigDto[];
  // --- FIN NUEVOS CAMPOS ---
}