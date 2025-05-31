import { IMercadoPagoItem, IMercadoPagoPayer } from '../mercadopago.interface';

export class CreatePreferenceDto {
    readonly cart: IMercadoPagoItem[];
    readonly total: number;
    readonly additionalInfo: {
        payer: IMercadoPagoPayer;
        success_url: string;
        failure_url: string;
        pending_url: string;
        webhook_url: string;
        external_reference: string;
    };
}