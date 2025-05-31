import { Controller, Post, Body, HttpException, HttpStatus, Res, Get } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { MercadopagoService } from '../mercadopago/mercadopago.service'; // Importar el servicio de MercadoPago

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly mercadopagoService: MercadopagoService, // Inyectar el servicio de MercadoPago
  ) {}

  @Post()
  async createOrder(@Body() createOrderDto: CreateOrderDto) {
    try {
      return await this.ordersService.create(createOrderDto);
    } catch (error) {
      console.error('Error detallado:', error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Endpoint para crear una preferencia de pago con MercadoPago
  @Post('create-preference')
  async createPreference(@Body() body: any, @Res() res) {
    const { cart, total, payer, successUrl, failureUrl, pendingUrl, webhookUrl, externalReference } = body;
    try {
      const preference = await this.mercadopagoService.createPreference(
        cart,
        total,
        payer, // Agregar el argumento 'payer'
        {
          successUrl: successUrl,
          failureUrl: failureUrl,
          pendingUrl: pendingUrl,
          webhookUrl: webhookUrl,
          externalReference: externalReference
        }
      );
      return res.status(HttpStatus.OK).json(preference);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
  }

  // Endpoint para manejar notificaciones de pago (webhook)
  @Post('webhook')
  async handleWebhook(@Body() body: any, @Res() res) {
    const { id, signature } = body;
    try {
      const payment = await this.mercadopagoService.handleWebhook(
        id,
        signature // Agregar el argumento 'signature'
      );
      return res.status(HttpStatus.OK).json(payment);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
  }

  @Get('monthly-sales')
  async getMonthlySales() {
    const sales = await this.ordersService.getMonthlySales();
    return sales;
  }

  @Get('annual-sales')
  async getAnnualSales() {
    const sales = await this.ordersService.getAnnualSales();
    return sales;
  }

  @Get('daily-sales')
  async getDailySales() {
    const sales = await this.ordersService.getDailySales();
    return sales;
  }

  @Get('top-sales')
  async getTopSales() {
    const sales = await this.ordersService.getTopSales();
    return sales;
  }
}