import { IsInt, IsNumber, Min, Max } from 'class-validator';

export class CreateProductVolumeDiscountDto {
  @IsInt()
  @Min(1)
  minQuantity: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercentage: number; // Porcentaje de descuento (0-100)
}