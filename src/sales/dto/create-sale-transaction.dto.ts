// src/sales/dto/create-sale-transaction.dto.ts
import {
  IsNotEmpty,
  IsInt,
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsPositive,
  Min,
  // ValidateNested, // Descomentar si se usan orderItems aquí
} from 'class-validator';
// import { Type } from 'class-transformer'; // Descomentar si se usan orderItems aquí

// Importa los tipos de los enums directamente.
// Estos son los tipos que `class-validator` usará para `IsEnum`.
import { PaymentMethodType, SaleChannel } from '@prisma/client';

// class OrderItemDto {
//   @IsNotEmpty()
//   @IsString()
//   productId: string;

//   @IsNotEmpty()
//   @IsInt()
//   @IsPositive()
//   quantity: number;

//   @IsNotEmpty()
//   @IsNumber()
//   @IsPositive()
//   price: number;
// }

export class CreateSaleTransactionDto {
  @IsNotEmpty()
  @IsInt()
  orderId: number;

  @IsNotEmpty()
  @IsString()
  clientId: string;

  @IsOptional()
  @IsString()
  storeId?: string;

  @IsOptional()
  @IsInt()
  sellerId?: number;

  @IsNotEmpty()
  @IsEnum(SaleChannel, { message: 'Canal de venta inválido. Valores permitidos: ONLINE_WEB, IN_PERSON_STORE' })
  saleChannel: SaleChannel;

  @IsNotEmpty()
  @IsEnum(PaymentMethodType, { message: 'Método de pago inválido. Valores permitidos: CASH, BANK_TRANSFER, etc.' })
  paymentMethod: PaymentMethodType;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  paymentGatewayId?: string;

  @IsOptional()
  @IsString()
  paymentGatewayStatus?: string;

  @IsOptional()
  @IsString()
  posTransactionId?: string;

  @IsOptional()
  @IsString()
  bankTransferReference?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amountReceivedByClient?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  // @IsOptional()
  // @IsString()
  // userIdForOrder?: string;

  // @IsOptional() // Si la orden se crea aquí, sería NotEmpty
  // @ValidateNested({ each: true })
  // @Type(() => OrderItemDto)
  // orderItems?: OrderItemDto[];
}