import { Injectable, OnModuleInit } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class UpdateUserRoleScript implements OnModuleInit {
  constructor(private readonly usersService: UsersService) {}

  async onModuleInit() {
    const username = 'admin'; // Cambia esto al nombre de usuario que deseas actualizar
    const user = await this.usersService.findOne(username);

    if (user) {
      user.role = 'superadmin'; // Asigna el rol superadmin
      await this.usersService.create(user);
      console.log(`Rol actualizado para el usuario ${username}`);
    } else {
      console.log(`Usuario ${username} no encontrado`);
    }
  }
}
