// apply-pricing.dto.ts
import { IsArray, IsOptional, IsString, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

class PricingProductDto {
  @IsString()
  id: string;

  @IsNumber()
  price: number;

  @IsNumber()
  @IsOptional()
  wholesalePrice?: number;

  // Solo incluye los campos absolutamente necesarios
}

export class ApplyPricingDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PricingProductDto)
  products: PricingProductDto[];
  
  @IsString()
  @IsOptional()
  wholesaleToken?: string;
}