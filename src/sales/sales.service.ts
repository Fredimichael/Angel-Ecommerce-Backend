import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service'; // Asegúrate que la ruta sea correcta
import { OrderStatus, PaymentMethodType, Prisma, SaleChannel, StoreProduct } from '@prisma/client';
import { CreateOrderDto } from './dto/create-order.dto';
import { ProcessPaymentDto } from './dto/process-payment.dto';
// Asumo que tienes un servicio para Mercado Pago
// import { MercadoPagoService } from '../mercadopago/mercadopago.service';

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);

  constructor(
    private readonly prisma: PrismaService,
    // @Inject(MercadoPagoService) private readonly mercadoPagoService: MercadoPagoService,
  ) {}

  async createOrder(createOrderDto: CreateOrderDto, userId: string /* ID del usuario logueado, si aplica */) {
    const {
      clientId,
      orderItems,
      total,
      saleChannel,
      storeId,
      sellerId,
      shippingAddress,
      shippingCity,
      shippingState,
      shippingZipCode,
    } = createOrderDto;

    if (saleChannel === SaleChannel.IN_PERSON_STORE && !storeId) {
      throw new BadRequestException('storeId es requerido para ventas en tienda.');
    }

    if (clientId) {
      const clientExists = await this.prisma.client.findUnique({ where: { id: clientId } });
      if (!clientExists) {
        throw new NotFoundException(`Cliente con ID ${clientId} no encontrado.`);
      }
    }
    if (storeId) {
        const storeExists = await this.prisma.store.findUnique({ where: { id: storeId } });
        if (!storeExists) {
          throw new NotFoundException(`Tienda con ID ${storeId} no encontrada.`);
        }
    }
     if (sellerId) {
        const sellerExists = await this.prisma.seller.findUnique({ where: { id: sellerId } });
        if (!sellerExists) {
          throw new NotFoundException(`Vendedor con ID ${sellerId} no encontrado.`);
        }
    }

    return this.prisma.$transaction(async (tx) => {
      for (const item of orderItems) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) {
          throw new NotFoundException(`Producto con ID ${item.productId} no encontrado.`);
        }

        if (saleChannel === SaleChannel.IN_PERSON_STORE) {
          const storeProduct = await tx.storeProduct.findUnique({
            where: { storeId_productId: { storeId: storeId!, productId: item.productId } },
          });
          if (!storeProduct || storeProduct.quantity < item.quantity) {
            throw new BadRequestException(
              `Stock insuficiente para ${product.name} en la tienda ${storeId}. Disponible: ${storeProduct?.quantity || 0}`,
            );
          }
        } else { 
          if (product.stock < item.quantity) {
            throw new BadRequestException(
              `Stock insuficiente para ${product.name}. Disponible: ${product.stock}`,
            );
          }
        }
      }

      const order = await tx.order.create({
        data: {
          userId, 
          clientId: clientId || null,
          sellerId: sellerId || null,
          total,
          status: OrderStatus.PENDING, 
          saleChannel, 
          storeId: storeId || null,   
          shippingAddress,
          shippingCity,
          shippingState,
          shippingZipCode,
          orderItems: {
            create: orderItems.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price, 
              total: item.quantity * item.price,
            })),
          },
        },
        include: { orderItems: true },
      });

      for (const item of orderItems) {
        if (saleChannel === SaleChannel.IN_PERSON_STORE) {
          await tx.storeProduct.update({
            where: { storeId_productId: { storeId: storeId!, productId: item.productId } },
            data: { quantity: { decrement: item.quantity } },
          });
           await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        } else { 
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }

      this.logger.log(`Pedido ${order.id} creado exitosamente. Canal: ${saleChannel}`);
      return order;
    });
  }

  async processPayment(processPaymentDto: ProcessPaymentDto, userIdPerformingPayment: string) {
    const {
      orderId,
      paymentMethod,
      amount,
      paymentGatewayId,
      paymentGatewayStatus,
      posTransactionId,
      bankTransferReference,
      amountReceivedByClient,
      changeGivenToClient,
      notes,
    } = processPaymentDto;

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { client: true, store: true, seller: true, orderItems: true }, // Incluir orderItems y otras relaciones necesarias
      });

      if (!order) {
        throw new NotFoundException(`Pedido con ID ${orderId} no encontrado.`);
      }
      if (order.status === OrderStatus.PAID || order.status === OrderStatus.CANCELLED || order.status === OrderStatus.REFUNDED) {
          throw new BadRequestException(`El pedido ${orderId} ya fue procesado o cancelado.`);
      }

      // Bandera para rastrear si el pedido se marcó como PAID en esta transacción
      let orderMarkedAsPaidInThisTransaction = false;

      if (order.saleChannel === SaleChannel.ONLINE_WEB && paymentMethod === PaymentMethodType.MERCADO_PAGO_ONLINE) {
        if (paymentGatewayStatus === 'approved') {
          await tx.order.update({
            where: { id: orderId },
            data: { status: OrderStatus.PAID },
          });
          orderMarkedAsPaidInThisTransaction = true; // Actualiza la bandera
          this.logger.log(`Pedido ${orderId} pagado online con Mercado Pago.`);
        } else {
          await tx.order.update({
            where: { id: orderId },
            data: { status: OrderStatus.PROCESSING }, 
          });
          this.logger.warn(`Pago de Mercado Pago para pedido ${orderId} no aprobado. Estado: ${paymentGatewayStatus}`);
           throw new BadRequestException(`Pago de Mercado Pago no aprobado. Estado: ${paymentGatewayStatus}`);
        }
      } else if (order.saleChannel === SaleChannel.IN_PERSON_STORE) {
        if (amount < order.total) {
            throw new BadRequestException(`El monto pagado (${amount}) es menor al total del pedido (${order.total}).`);
        }
        await tx.order.update({
          where: { id: orderId },
          data: { status: OrderStatus.PAID }, 
        });
        orderMarkedAsPaidInThisTransaction = true; // Actualiza la bandera
        this.logger.log(`Pedido ${orderId} pagado en tienda con ${paymentMethod}.`);
      } else {
          throw new BadRequestException(`Combinación de canal de venta (${order.saleChannel}) y método de pago (${paymentMethod}) no soportada directamente aquí.`);
      }

      const saleTransaction = await tx.saleTransaction.create({
        data: {
          orderId,
          clientId: order.clientId!, 
          storeId: order.storeId,
          sellerId: order.sellerId,
          saleChannel: order.saleChannel!,
          paymentMethod,
          amount,
          transactionDate: new Date(),
          paymentGatewayId,
          paymentGatewayStatus,
          posTransactionId,
          bankTransferReference,
          amountReceivedByClient,
          changeGivenToClient,
          notes,
        },
      });

      // Usar la bandera 'orderMarkedAsPaidInThisTransaction' para la lógica de 'DELIVERED'
      if (order.saleChannel === SaleChannel.IN_PERSON_STORE && orderMarkedAsPaidInThisTransaction) {
         await tx.order.update({
            where: { id: orderId },
            data: { status: OrderStatus.DELIVERED }, 
        });
         this.logger.log(`Pedido ${orderId} marcado como ENTREGADO.`);
      }

      this.logger.log(`Transacción ${saleTransaction.id} creada para pedido ${orderId}.`);
      // Devolver la orden con su estado más reciente después de todas las actualizaciones en la transacción
      const finalUpdatedOrder = await tx.order.findUnique({ where: { id: orderId }, include: { orderItems: true, client: true, store: true, seller: true } });
      return { order: finalUpdatedOrder, saleTransaction };
    });
  }

  async createMercadoPagoPreference(orderId: number, items: { title: string, quantity: number, unit_price: number, id: string }[]) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }});
    if (!order) throw new NotFoundException('Pedido no encontrado');
    if (order.status !== OrderStatus.PENDING) throw new BadRequestException('El pedido no está pendiente de pago');

    this.logger.log(`Creando preferencia de Mercado Pago para pedido ${orderId}`);
    return `https://mercadopago.com/checkout/v1/redirect?pref_id=TEST-PREF-ID-FOR-${orderId}`; 
  }

  async handleMercadoPagoWebhook(data: any) {
    this.logger.log('Webhook de Mercado Pago recibido:', JSON.stringify(data));

    if (data.type === 'payment') {
      const paymentId = data.data.id;
      
      const paymentInfo = { // Placeholder
        external_reference: "123", 
        status: "approved", 
        id: paymentId.toString(),
      };

      if (paymentInfo && paymentInfo.external_reference) {
        const orderId = parseInt(paymentInfo.external_reference);
        const order = await this.prisma.order.findUnique({ where: { id: orderId } });

        if (order) {
          // Solo procesar si el pedido todavía está PENDIENTE o en un estado que permita el pago
          if (order.status === OrderStatus.PENDING || order.status === OrderStatus.PROCESSING) {
            const processPaymentPayload: ProcessPaymentDto = {
              orderId,
              paymentMethod: PaymentMethodType.MERCADO_PAGO_ONLINE,
              amount: order.total, 
              paymentGatewayId: paymentInfo.id.toString(),
              paymentGatewayStatus: paymentInfo.status,
            };
            try {
              const systemUserId = 'SYSTEM_WEBHOOK'; 
              await this.processPayment(processPaymentPayload, systemUserId);
              this.logger.log(`Webhook procesado para pedido ${orderId}, estado MP: ${paymentInfo.status}`);
            } catch (error) {
              this.logger.error(`Error al procesar pago desde webhook para pedido ${orderId}:`, error.message);
            }
          } else {
            this.logger.warn(`Webhook de MP: Pedido ${orderId} no está en estado PENDIENTE/PROCESANDO. Estado actual: ${order.status}. No se procesa el pago.`);
          }
        } else {
          this.logger.warn(`Webhook de MP: Pedido con external_reference ${orderId} no encontrado.`);
        }
      } else {
        this.logger.warn('Webhook de MP: No se pudo obtener external_reference del pago.');
      }
    }
  }
}