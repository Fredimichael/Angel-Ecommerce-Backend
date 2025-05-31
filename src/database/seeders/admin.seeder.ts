import { Injectable, OnModuleInit } from '@nestjs/common';
import { UsersService } from '../../users/users.service';

@Injectable()
export class AdminSeeder implements OnModuleInit {
  constructor(private readonly usersService: UsersService) {}

  async onModuleInit() {
    await this.seedSuperAdmin();
  }

  private async seedSuperAdmin() {
    try {
      await this.usersService.createAdmin(
        'superadmin@tienda.com', 
        'AdminPassword123!'
      );
      console.log('✅ SuperAdmin creado exitosamente');
    } catch (error) {
      console.log('ℹ️ SuperAdmin ya existía en la base de datos');
    }
  }
}