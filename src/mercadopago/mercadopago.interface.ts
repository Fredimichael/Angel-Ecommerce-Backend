// mercadopago.interface.ts
export interface IMercadoPagoItem {
    id?: string;
    title: string;
    unit_price: number;
    quantity: number;
    description?: string;
    picture_url?: string;
    currency_id?: string;
}

export interface IMercadoPagoPayer {
    name: string;
    surname?: string;
    email: string;
    phone?: {
        area_code?: string;
        number: string;
    };
    address?: {
        zip_code?: string;
        street_name?: string;
        street_number?: string;
    };
    identification?: {
        type?: string;
        number?: string;
    };
}