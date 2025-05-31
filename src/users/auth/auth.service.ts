import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.usersService.findOne(username);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return null;
    }
    const { password: _, ...result } = user;
    return result;
  }

  async login(user: any) {
      // Asegurarse que el rol esté en minúsculas
      const userRole = user.role.toLowerCase();
      
      const payload = { 
          sub: user.id, 
          username: user.username, 
          role: userRole  // Rol en minúsculas
      };
      return {
          access_token: this.jwtService.sign(payload),
      };
  }

  // AÑADE ESTOS MÉTODOS NUEVOS
  async createAdmin(username: string, password: string) {
    const hashedPassword = await bcrypt.hash(password, 10);
    return this.usersService.create({
      username,
      password: hashedPassword,
      role: 'admin'
    });
  }

  async createSeller(username: string) {
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    return this.usersService.create({
      username,
      password: hashedPassword,
      role: 'seller',
      mustChangePassword: true
    });
  }

  async createRole(username: string, password: string, role: string) {
    if (role === 'superadmin') {
        throw new Error('No tienes permiso para crear un superadmin');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    return this.usersService.createRole(username, hashedPassword, role);
  }
}