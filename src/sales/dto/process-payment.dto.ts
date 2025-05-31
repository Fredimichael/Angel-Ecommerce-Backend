import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  IsEnum,
  IsInt,
} from 'class-validator';
import { PaymentMethodType } from '@prisma/client'; // Importa tu enum

export class ProcessPaymentDto {
  @IsInt()
  @IsNotEmpty()
  orderId: number;

  @IsEnum(PaymentMethodType)
  @IsNotEmpty()
  paymentMethod: PaymentMethodType;

  @IsNumber()
  @IsPositive()
  amount: number; // Monto que cubre esta transacción (puede ser el total o parcial)

  // Campos específicos según el método de pago
  @IsOptional()
  @IsString()
  paymentGatewayId?: string; // Para Mercado Pago ID de transacción

  @IsOptional()
  @IsString()
  paymentGatewayStatus?: string; // Para Mercado Pago status

  @IsOptional()
  @IsString()
  posTransactionId?: string; // Para pagos con POS

  @IsOptional()
  @IsString()
  bankTransferReference?: string; // Para transferencias

  // Para pagos en efectivo (si aplica)
  @IsOptional()
  @IsNumber()
  @Min(0)
  amountReceivedByClient?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  changeGivenToClient?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}