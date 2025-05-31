import { Controller, Post, Body, UseGuards, Request, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @Post('create-seller')
  async createSeller(@Body('username') username: string) {
    return this.authService.createSeller(username);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin', 'admin') // Permitir acceso a superadmin y admin
  @Post('create-role')
  async createRole(
    @Body('username') username: string,
    @Body('password') password: string,
    @Body('role') role: string,
  ) {
    return this.authService.createRole(username, password, role);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    // Devuelve explícitamente un objeto con id, username, role, etc.
    return {
      id: req.user.id || req.user.sub, // Asegura que siempre haya un 'id'
      username: req.user.username,
      role: req.user.role,
      mustChangePassword: req.user.mustChangePassword ?? false,
      // ...agrega aquí cualquier otro campo necesario...
    };
  }
}