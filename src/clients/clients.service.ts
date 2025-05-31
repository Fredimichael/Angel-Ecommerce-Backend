import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { Client } from './entities/client.entity';
import { BehaviorRating } from './entities/client.entity';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async create(createClientDto: CreateClientDto): Promise<Client> {
    console.log('DTO recibido en backend:', JSON.stringify(createClientDto, null, 2));
    try {
      // Convierte birthDate a ISO string si existe y no está vacío
      let birthDate = undefined;
      if (createClientDto.birthDate) {
        // Si ya es un string ISO, esto no cambia nada, si es YYYY-MM-DD lo convierte correctamente
        birthDate = new Date(createClientDto.birthDate).toISOString();
      }

      // Elimina requiresInvoice si existe en el DTO
      const { requiresInvoice, ...filteredDto } = createClientDto as any;

      return this.prisma['Client'].create({
        data: {
          ...filteredDto,
          birthDate,
          behaviorRating: createClientDto.behaviorRating || BehaviorRating.GOOD,
          creditLimit: createClientDto.creditLimit || 0,
          cashLimit: createClientDto.cashLimit || 0,
        },
      });
    } catch (error) {
      console.error('Error al crear cliente:', error);
      if (error.response) {
        console.error('Error response data:', error.response.data);
      }
      throw error;
    }
  }

  async findAll(): Promise<Client[]> {
    return this.prisma['Client'].findMany();
  }

  async findOne(id: string): Promise<Client | null> {
    return this.prisma['Client'].findUnique({
      where: { id },
    });
  }

  async update(id: string, updateClientDto: UpdateClientDto): Promise<Client> {
    return this.prisma['Client'].update({
      where: { id },
      data: updateClientDto,
    });
  }

  async remove(id: string): Promise<Client> {
    return this.prisma['Client'].delete({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<Client | null> {
    return this.prisma['Client'].findUnique({
      where: { email },
    });
  }

  async findByDni(dni: string): Promise<Client | null> {
    return this.prisma['Client'].findUnique({
      where: { dni },
    });
  }
}