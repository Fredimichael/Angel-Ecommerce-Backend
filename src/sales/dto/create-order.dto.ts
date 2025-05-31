import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateNested,
  IsEnum,
  IsUUID, // Si tus IDs de producto son CUID/UUID
} from 'class-validator';
import { SaleChannel } from '@prisma/client'; // Importa tu enum de Prisma

class OrderItemDto {
  @IsNotEmpty()
  @IsString() // O IsUUID si Product.id es CUID
  productId: string;

  @IsInt()
  @IsPositive()
  @Min(1)
  quantity: number;

  @IsNumber()
  @IsPositive()
  price: number; // Precio unitario al momento de la venta (importante para evitar cambios de precio)
}

export class CreateOrderDto {
  @IsOptional()
  @IsString() // O IsUUID si Client.id es CUID
  clientId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  orderItems: OrderItemDto[];

  @IsNumber()
  @IsPositive()
  total: number; // Calculado en el frontend, pero idealmente recalculado/validado en backend

  @IsEnum(SaleChannel)
  @IsNotEmpty()
  saleChannel: SaleChannel; // 'ONLINE_WEB' o 'IN_PERSON_STORE'

  @IsOptional()
  @IsString() // O IsUUID si Store.id es CUID
  storeId?: string; // Requerido si saleChannel es 'IN_PERSON_STORE'

  @IsOptional()
  @IsInt()
  sellerId?: number; // Requerido si saleChannel es 'IN_PERSON_STORE' y tienes vendedores

  // Para ventas online (pueden venir del frontend o ser recuperados en backend)
  @IsOptional()
  @IsString()
  shippingAddress?: string;

  @IsOptional()
  @IsString()
  shippingCity?: string;

  @IsOptional()
  @IsString()
  shippingState?: string;

  @IsOptional()
  @IsString()
  shippingZipCode?: string;
}