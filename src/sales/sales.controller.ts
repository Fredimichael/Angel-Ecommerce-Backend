import { Controller, Post, Body, ValidationPipe, UsePipes, Logger, Get, Param, ParseIntPipe, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ProcessPaymentDto } from './dto/process-payment.dto';
// import { AuthGuard } from '@nestjs/passport'; // Si usas autenticación
// import { GetUser } from '../auth/decorators/get-user.decorator'; // Decorador para obtener usuario

@Controller('sales')
export class SalesController {
  private readonly logger = new Logger(SalesController.name);

  constructor(private readonly salesService: SalesService) {}

  @Post('order')
  // @UseGuards(AuthGuard()) // Proteger endpoint
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async createOrder(
    @Body() createOrderDto: CreateOrderDto,
    // @GetUser() user: User, // Obtener usuario autenticado
    @Req() req: any, // Alternativa si no tienes GetUser, para obtener user.id del token decodificado
    ) {
    this.logger.log(`Intento de creación de pedido: ${JSON.stringify(createOrderDto)}`);
    //const userId = user.id; // O req.user.id dependiendo de tu setup de Auth
    const placeholderUserId = 'user-placeholder-id'; // REEMPLAZAR con ID de usuario real
    return this.salesService.createOrder(createOrderDto, placeholderUserId);
  }

  @Post('payment')
  // @UseGuards(AuthGuard())
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async processPayment(
    @Body() processPaymentDto: ProcessPaymentDto,
    // @GetUser() user: User,
    @Req() req: any,
    ) {
    this.logger.log(`Intento de procesamiento de pago: ${JSON.stringify(processPaymentDto)}`);
    //const userId = user.id;
    const placeholderUserId = 'user-placeholder-id'; // REEMPLAZAR
    return this.salesService.processPayment(processPaymentDto, placeholderUserId);
  }

  // --- Endpoints para Mercado Pago (ONLINE) ---
  @Post('order/:orderId/create-mercadopago-preference')
  // @UseGuards(AuthGuard())
  async createMercadoPagoPreference(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body() body: { items: { title: string, quantity: number, unit_price: number, id: string }[] } // El frontend debe enviar los items formateados para MP
  ) {
    this.logger.log(`Creando preferencia de MP para pedido: ${orderId}`);
    return this.salesService.createMercadoPagoPreference(orderId, body.items);
  }

  @Post('mercado-pago-webhook')
  @HttpCode(HttpStatus.OK) // MercadoPago espera un 200 o 201
  async mercadoPagoWebhook(@Body() data: any, @Req() req: any) {
    // Es importante verificar la autenticidad del webhook si es posible (ej. x-signature header)
    this.logger.log(`Webhook de Mercado Pago recibido. IP: ${req.ip}`);
    // No bloquees la respuesta a MercadoPago con lógica pesada. Procesa rápido o usa colas.
    this.salesService.handleMercadoPagoWebhook(data).catch(err => {
        this.logger.error("Error asíncrono procesando webhook de MP:", err);
    });
    return { received: true }; // Responder inmediatamente a MercadoPago
  }

  // Podrías añadir endpoints para GET /orders, GET /orders/:id, etc.
}