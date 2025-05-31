import { Injectable } from '@nestjs/common';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { verifyWebhookSignature } from './mercadopago.utils';
import { IMercadoPagoItem, IMercadoPagoPayer } from './mercadopago.interface';

@Injectable()
export class MercadopagoService {
  private readonly client: MercadoPagoConfig;
  private readonly preference: Preference;
  private readonly payment: Payment;

  constructor() {
    console.log('Initializing MercadoPago with token:', process.env.MERCADOPAGO_ACCESS_TOKEN); // Debug log
    this.client = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
      options: { timeout: 5000 }
    });
    this.preference = new Preference(this.client);
    this.payment = new Payment(this.client);
  }

  async createPreference(
    items: IMercadoPagoItem[],
    total: number,
    payer: IMercadoPagoPayer,
    config: {
      successUrl: string;
      failureUrl: string;
      pendingUrl: string;
      webhookUrl: string;
      externalReference: string;
    }
  ) {
    // Validación de datos
    if (!items || items.length === 0) {
      throw new Error('El carrito no puede estar vacío');
    }
    if (!payer.name || !payer.email) {
      throw new Error('Nombre y email del comprador son requeridos');
    }

    const mappedItems = items.map((item, index) => ({
      ...item,
      id: item.id || `item-${index}-${Date.now()}`,
      currency_id: 'ARS',
      unit_price: Number(item.unit_price),
      quantity: Number(item.quantity)
    }));

    const preferenceData = {
      items: mappedItems,
      payer: {
        ...payer,
        phone: payer.phone ? {
          area_code: payer.phone.area_code || '',
          number: payer.phone.number.toString()
        } : undefined,
        address: payer.address ? {
          zip_code: payer.address.zip_code || '',
          street_name: payer.address.street_name || '',
          street_number: payer.address.street_number || ''
        } : undefined
      },
      back_urls: {
        success: config.successUrl,
        failure: config.failureUrl,
        pending: config.pendingUrl
      },
      auto_return: 'approved',
      notification_url: config.webhookUrl,
      external_reference: config.externalReference
    };

    console.log('Creating preference with data:', preferenceData); // Debug log

    try {
      const response = await this.preference.create({ body: preferenceData });
      console.log('MercadoPago response:', response); // Debug log
      return {
        id: response.id,
        init_point: response.init_point,
        sandbox_init_point: response.sandbox_init_point
      };
    } catch (error) {
      console.error('MercadoPago Error Details:', error);
      throw new Error(`Error al crear la preferencia de pago: ${error.message}`);
    }
  }

  async handleWebhook(body: any, signature: string) {
    if (!verifyWebhookSignature(body, signature, process.env.MERCADOPAGO_WEBHOOK_SECRET)) {
      throw new Error('Invalid webhook signature');
    }

    switch (body.type) {
      case 'payment':
        return this.handlePaymentWebhook(body.data.id);
      case 'merchant_order':
        return this.handleOrderWebhook(body.data.id);
      default:
        return { status: 'unhandled_event' };
    }
  }


private async handlePaymentWebhook(paymentId: string) {
  const payment = await this.payment.get({ id: paymentId });
  
  // Ejemplo de lógica para actualizar tu base de datos
  const orderId = payment.external_reference;
  const status = payment.status; // 'approved', 'rejected', etc.
  
  // Aquí deberías actualizar tu orden en la base de datos
  // await this.orderService.updateOrderStatus(orderId, status);
  
  return {
      paymentId,
      status,
      orderId
  };
}

  private async handleOrderWebhook(orderId: string) {
    const order = await this.payment.get({ id: orderId });
    // Implementar lógica de negocio para actualizar estado de orden
    return order;
  }
}