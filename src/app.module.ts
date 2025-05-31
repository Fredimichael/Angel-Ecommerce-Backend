import { Module } from '@nestjs/common';
import { AuthModule } from './users/auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesModule } from './categories/categories.module';
import { SubcategoriesModule } from './subcategories/subcategories.module';
import { SellersModule } from './sellers/sellers.module';
import { OrdersModule } from './orders/orders.module';
import { SupplierModule } from './supplier/supplier.module';
import { CloudinaryService } from './cloudinary/cloudinary.service';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { ConfigModule} from '@nestjs/config';
import { MercadopagoService } from './mercadopago/mercadopago.service';
import { MercadopagoController } from './mercadopago/mercadopago.controller';
import { MercadopagoModule } from './mercadopago/mercadopago.module';
import { StoresModule } from './stores/stores.module';
import { StoreStockModule } from './store-stock/store-stock.module';
import { CarouselModule } from './carousel/carousel.module';
import { WholesaleModule } from './wholesale/wholesale.module';
import { User } from './users/entities/user.entity';
import { AdminSeeder } from './scripts/create-first-admin'; // Importar el seeder
import { ClientsModule } from './clients/clients.module';
import { SalesModule } from './sales/sales.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',  // Tipo de base de datos
      host: 'localhost',  // Dirección del host
      port: 5432,  // Puerto de la base de datos
      username: 'postgres',  // Usuario de la base de datos
      password: '592618',  // Contraseña de la base de datos
      database: 'postgres',  // Nombre de la base de datos
      entities: [__dirname + '/**/*.entity{.ts,.js}'],  // Carga automática de entidades
      synchronize: true,  // Sincronización automática (solo para desarrollo)
    }),
    TypeOrmModule.forFeature([User]), // Registrar la entidad User
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    UsersModule,
    ProductsModule,
    CategoriesModule,
    SubcategoriesModule,
    SellersModule,
    OrdersModule,
    SupplierModule,
    CloudinaryModule,
    MercadopagoModule,
    StoresModule,
    StoreStockModule,
    CarouselModule,
    WholesaleModule,
    ClientsModule,
    SalesModule
  ],
  providers: [
    AdminSeeder, // Agregar el seeder como proveedor
    CloudinaryService,
    MercadopagoService
  ],
  controllers: [
    MercadopagoController
  ],
})
export class AppModule {}
