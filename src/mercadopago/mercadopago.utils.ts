// mercadopago.utils.ts
export const verifyWebhookSignature = (body: any, signature: string, secret: string): boolean => {
    const crypto = require('crypto');
    const hash = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(body))
        .digest('hex');
        
    return hash === signature;
};