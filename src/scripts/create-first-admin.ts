// src/scripts/create-first-admin.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AdminSeeder implements OnModuleInit {
  constructor(private readonly usersService: UsersService) {}

  async onModuleInit() {
    await this.createAdmin();
  }

  private async createAdmin() {
    const superAdminUsername = 'superadmin'; // Cambiar el nombre de usuario
    const superAdminExists = await this.usersService.findOne(superAdminUsername);
    
    if (!superAdminExists) {
        const hashedPassword = await bcrypt.hash('superadmin123', 10); // Cambiar la contraseña predeterminada
        
          await this.usersService.createSuperAdmin(superAdminUsername, hashedPassword);
        
        console.log('Usuario superadmin creado:', superAdminUsername);
    }
  }
}