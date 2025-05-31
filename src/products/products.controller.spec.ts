import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

describe('ProductsController', () => {
  let controller: ProductsController;
  let service: ProductsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: {
            createProductWithStock: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            updateProduct: jest.fn(),
            deleteProduct: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createProductWithStock', () => {
    it('should call createProductWithStock method', async () => {
      const createProductDto = {
        name: 'Test Product',
        description: 'Test Description',
        price: 100,
        stock: 10,
        subcategoryId: '1',
        supplierId: 1,
        storeId: 1,
        initialStock: 5,
      };

      await controller.createProductWithStock(createProductDto);
      expect(service.createProductWithStock).toHaveBeenCalledWith(createProductDto);
    });
  });
});