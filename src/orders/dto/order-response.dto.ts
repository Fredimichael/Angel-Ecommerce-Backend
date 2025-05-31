export class OrderResponseDto {
  id: number;
  userId: string;
  sellerId: number;
  total: number;
  orderItems: {
    productId: number;
    quantity: number;
    price: number;
    total: number;
  }[];
}