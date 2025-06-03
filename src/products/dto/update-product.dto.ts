// src/products/dto/update-product.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';
import { IsOptional, IsNumber, IsInt, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateProductVolumeDiscountDto } from './create-product-volume-discount.dto'; // Asumiendo que tienes este DTO
import { CreateProductBoxConfigDto } from './create-product-box-config.dto';       // Asumiendo que tienes este DTO

export class UpdateProductDto extends PartialType(CreateProductDto) {
  // Añadimos 'stock' aquí explícitamente como opcional para las actualizaciones.
  @IsOptional()
  @IsNumber()
  @IsInt()
  @Min(0)
  stock?: number;

  // También, si vas a actualizar los descuentos y configuraciones de caja como arrays completos,
  // ya están cubiertos por PartialType si CreateProductDto los tiene.
  // Si necesitas una lógica de actualización más granular para los elementos dentro de estos arrays,
  // podrías crear DTOs específicos de actualización para ellos.
  // Por ahora, mantenemos la estructura que hereda de CreateProductDto.

  // Re-declaramos los arrays aquí para asegurar que @ValidateNested y @Type se apliquen
  // correctamente incluso cuando vienen a través de PartialType, o si quieres usar
  // DTOs de actualización específicos para los elementos del array.
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductVolumeDiscountDto)
  volumeDiscounts?: CreateProductVolumeDiscountDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductBoxConfigDto) // O un UpdateProductBoxConfigDto
  boxConfigurations?: CreateProductBoxConfigDto[];
}