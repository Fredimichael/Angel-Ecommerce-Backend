import { Controller, Post, Body, UseGuards, Get, Delete, Param} from '@nestjs/common';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { Roles } from './auth/decorators/roles.decorator';
import { UsersService } from '../users/users.service';


@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('create-seller')
  @Roles('admin', 'seller')
  async createSeller(@Body('username') username: string) {
    return this.usersService.createSeller(username);
  }

  //traer todos los vendedores
  @Get('sellers')
  @Roles('superadmin', 'seller')
  async getSellers() {
    return this.usersService.findAllSellers();
  }

  // Eliminar un vendedor por ID
  @Delete('delete/:id')
  @Roles('superadmin', 'admin')
  async deleteSeller(@Param('id') id: string) {
    return this.usersService.remove(id);
  } 
}