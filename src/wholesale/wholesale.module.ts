import { Module } from '@nestjs/common';
import { WholesaleService } from './wholesale.service';
import { WholesaleController } from './wholesale.controller';

@Module({
  providers: [WholesaleService],
  controllers: [WholesaleController]
})
export class WholesaleModule {}
