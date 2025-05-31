import { IsArray, IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class CreateOrderDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsNumber()
  sellerId: number;

  @IsNotEmpty()
  @IsNumber()
  total: number;

  @IsArray()
  @IsNotEmpty()
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;

  @IsNotEmpty()
  @IsString()
  paymentMethod: string; // Método de pago (MercadoPago, tarjeta, etc.)
}