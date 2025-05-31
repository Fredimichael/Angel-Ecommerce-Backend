// prisma.service.ts
import { Injectable, OnModuleInit, INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    this.$on('beforeExit' as never, async () => {
      await app.close();
    });
  }

  // Elimina la propiedad stockTransfer definida incorrectamente
  // stockTransfer: any;

  constructor() {
    super();
    // No es necesario inicializar stockTransfer manualmente
    // this.stockTransfer = {}; 
  }
}

