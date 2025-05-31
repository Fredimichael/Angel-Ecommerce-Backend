import { Test, TestingModule } from '@nestjs/testing';
import { WholesaleController } from './wholesale.controller';

describe('WholesaleController', () => {
  let controller: WholesaleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WholesaleController],
    }).compile();

    controller = module.get<WholesaleController>(WholesaleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
