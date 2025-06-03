import { IsString, IsInt, IsNumber, Min, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class CreateProductBoxConfigDto {
  @IsString()
  @MaxLength(100) // Ejemplo de límite
  name: string;

  @IsInt()
  @Min(1)
  quantityInBox: number;

  @IsNumber()
  @Min(0)
  totalBoxPrice: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  sku?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}