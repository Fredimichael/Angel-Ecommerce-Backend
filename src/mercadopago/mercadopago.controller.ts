import { Controller, Post, Body, Res, HttpStatus, Req } from '@nestjs/common';
import { MercadopagoService } from './mercadopago.service';
import { CreatePreferenceDto } from './dto/create-preference.dto';

@Controller('mercadopago')
export class MercadopagoController {
  constructor(private readonly mercadopagoService: MercadopagoService) {}

  @Post('create-preference')
  async createPreference(@Body() body: CreatePreferenceDto, @Res() res) {
    try {
      console.log('Raw body received:', body); // Debug adicional
      
      if (!body || !body.cart || !body.additionalInfo?.payer) {
        throw new Error('Datos de preferencia incompletos');
      }

      if (!body.cart || !Array.isArray(body.cart) || body.cart.length === 0) {
        throw new Error('El carrito no puede estar vacío');
      }
      if (!body.total || typeof body.total !== 'number') {
        throw new Error('El total debe ser un número válido');
      }
      if (!body.additionalInfo || !body.additionalInfo.payer || !body.additionalInfo.payer.email) {
        throw new Error('Información del comprador incompleta');
      }

      const preference = await this.mercadopagoService.createPreference(
        body.cart,
        body.total,
        body.additionalInfo.payer,
        {
          successUrl: body.additionalInfo.success_url,
          failureUrl: body.additionalInfo.failure_url,
          pendingUrl: body.additionalInfo.pending_url,
          webhookUrl: body.additionalInfo.webhook_url,
          externalReference: body.additionalInfo.external_reference
        }
      );
      
      return res.status(HttpStatus.OK).json(preference);
    } catch (error) {
      console.error('Full error stack:', error);
      return res.status(HttpStatus.BAD_REQUEST).json({
        error: error.message,
        details: error.response?.body || 'Verifique los datos enviados'
      });
    }
  }

  @Post('webhook')
  async handleWebhook(@Body() body: any, @Req() req, @Res() res) {
    try {
      const signature = req.headers['x-signature'];
      if (!signature) {
        return res.status(HttpStatus.UNAUTHORIZED).json({ error: 'Missing signature' });
      }

      const result = await this.mercadopagoService.handleWebhook(body, signature);
      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      console.error('Webhook error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ 
        error: error.message 
      });
    }
  }
}