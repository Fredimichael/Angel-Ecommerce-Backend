import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findOne(username: string): Promise<User | undefined> {
    return this.usersRepository.findOne({ where: { username } });
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(userData);
    return this.usersRepository.save(user);
  }

  async createAdmin(username: string, password: string): Promise<User> {
    const adminData = {
      username,
      password,
      role: 'admin',
      mustChangePassword: false,
    };
    return this.create(adminData);
  }

  async createSuperAdmin(username: string, password: string): Promise<User> {
    const superAdminData = {
      username,
      password,
      role: 'superadmin',
      mustChangePassword: false,
    };
    return this.create(superAdminData);
  }

  async createSeller(username: string): Promise<User> {
    const tempPassword = Math.random().toString(36).slice(-8);
    const sellerData = {
      username,
      password: tempPassword,
      role: 'seller',
      mustChangePassword: true,
    };
    return this.create(sellerData);
  }

  async createRole(username: string, password: string, role: string): Promise<User> {
    const userData = {
      username,
      password,
      role,
      mustChangePassword: role === 'seller',
    };
    return this.create(userData);
  }

  // traer todos los vendedores
  async findAllSellers(): Promise<User[]> {
    return this.usersRepository.find({ where: { role: 'seller' } });
  }

  // Eliminar un usuario por ID
  async remove(id: string): Promise<void> {
    await this.usersRepository.delete(id);
  }
}