import { Test, TestingModule } from '@nestjs/testing';
import { MercadopagoService } from './mercadopago.service';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

jest.mock('mercadopago');

describe('MercadopagoService', () => {
  let service: MercadopagoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MercadopagoService],
    }).compile();

    service = module.get<MercadopagoService>(MercadopagoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPreference', () => {
    it('should create a preference', async () => {
      const cart = [{ name: 'Product 1', price: 100, quantity: 1 }];
      const total = 100;

      const mockResponse = { id: 'mock-preference-id' };
      jest.spyOn(Preference.prototype, 'create').mockResolvedValue(mockResponse);

      const result = await service.createPreference(cart, total);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('handleWebhook', () => {
    it('should handle a webhook', async () => {
      const paymentId = 'mock-payment-id';

      const mockResponse = { id: paymentId, status: 'approved' };
      jest.spyOn(Payment.prototype, 'get').mockResolvedValue(mockResponse);

      const result = await service.handleWebhook(paymentId);
      expect(result).toEqual(mockResponse);
    });
  });
});