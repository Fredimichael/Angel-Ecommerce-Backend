import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCarouselDto } from './dto/create-carousel.dto';
import { UpdateCarouselDto } from './dto/update-carousel.dto';

@Injectable()
export class CarouselService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllCarousels() {
    return this.prisma.carousel.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCarouselById(id: number) {
    return this.prisma.carousel.findUnique({
      where: { id },
    });
  }

  async createCarousel(dto: CreateCarouselDto) {
    return this.prisma.carousel.create({
      data: dto,
    });
  }

  async updateCarousel(id: number, dto: UpdateCarouselDto) {
    return this.prisma.carousel.update({
      where: { id },
      data: dto,
    });
  }

  async deleteCarousel(id: number) {
    return this.prisma.carousel.delete({
      where: { id },
    });
  }

//editar carousel
  async editCarousel(id: number, dto: UpdateCarouselDto) {
    return this.prisma.carousel.update({
      where: { id },
      data: dto,
    });
  }
}