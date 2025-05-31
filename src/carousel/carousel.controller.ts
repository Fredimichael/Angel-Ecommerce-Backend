import { Controller, Post, Get, Put, Delete, UseInterceptors, UploadedFile, Body, Param, BadRequestException, Req, ParseIntPipe, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';
import * as sharp from 'sharp';
import { CarouselService } from './carousel.service';
import { CreateCarouselDto } from './dto/create-carousel.dto';
import { UpdateCarouselDto } from './dto/update-carousel.dto';
import { Request, Response } from 'express';
import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';

@Controller('carousel')
export class CarouselController {
    constructor(private readonly carouselService: CarouselService) {}

    /**
     * Obtener todos los elementos del carrusel
     */
    @Get()
    async getAllCarousels() {
        return this.carouselService.getAllCarousels();
    }

    /**
     * Obtener un elemento del carrusel por ID
     */
    @Get(':id')
    async getCarouselById(@Param('id', ParseIntPipe) id: number) {
        return this.carouselService.getCarouselById(id);
    }

    /**
     * Subir imagen y crear nuevo elemento de carrusel
     */

    
    @Post('upload')
    @UseInterceptors(FileInterceptor('image', {
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
        fileFilter: (req, file, cb) => {
            if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
                return cb(
                    new BadRequestException('Solo se permiten imágenes (jpg, jpeg, png, gif, webp)'),
                    false
                );
            }
            cb(null, true);
        }
    }))
    async uploadImage(
        @UploadedFile() file: Express.Multer.File,
        @Body() body: Record<string, string>,
        @Req() req: Request
    ) {
        if (!file) {
            throw new BadRequestException('La imagen es requerida');
        }
    
        // Validación de campos
        const requiredFields = ['title', 'subtitle', 'link', 'accent'];
        const missingFields = requiredFields.filter(field => !body[field]);
        if (missingFields.length > 0) {
            throw new BadRequestException(`Faltan campos requeridos: ${missingFields.join(', ')}`);
        }
    
        // Generar nombre único para la imagen
        const uniqueName = `${uuidv4()}.webp`;
        const uploadPath = path.join(process.cwd(), 'src', 'uploads', 'carousel');
    
        // Crear directorio si no existe
        if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
        }
    
        // Procesar imagen con sharp
        const webpPath = path.join(uploadPath, uniqueName);
        await sharp(file.buffer)
            .webp({ quality: 80 })
            .toFile(webpPath);
    
        // Construir URL accesible
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const imageUrl = `${baseUrl}/carousel/images/${uniqueName}`;
    
        const dto: CreateCarouselDto = {
            title: body.title,
            subtitle: body.subtitle,
            link: body.link,
            accent: body.accent,
            isOffer: body.isOffer === 'true',
            discount: body.discount || null,
            image: imageUrl
        };
    
        return this.carouselService.createCarousel(dto);
    }

    //Editar un elemento del carrusel
    // Eliminar el endpoint duplicado (editCarousel) y modificar updateCarousel:
    @Put(':id')
    @UseInterceptors(FileInterceptor('image', {
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (req, file, cb) => {
            if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
                return cb(
                    new BadRequestException('Solo se permiten imágenes (jpg, jpeg, png, gif, webp)'),
                    false
                );
            }
            cb(null, true);
        }
    }))
    async updateCarousel(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: Record<string, string>,
        @UploadedFile() file: Express.Multer.File,
        @Req() req: Request
    ) {
        const dto: UpdateCarouselDto = {
            title: body.title,
            subtitle: body.subtitle,
            link: body.link,
            accent: body.accent,
            isOffer: body.isOffer === 'true',
            discount: body.discount || null,
        };

        // Si hay una nueva imagen, procesarla
        if (file) {
            const uniqueName = `${uuidv4()}.webp`;
            const uploadPath = path.join(process.cwd(), 'src', 'uploads', 'carousel');

            if (!existsSync(uploadPath)) {
                mkdirSync(uploadPath, { recursive: true });
            }

            const webpPath = path.join(uploadPath, uniqueName);
            await sharp(file.buffer)
                .webp({ quality: 80 })
                .toFile(webpPath);

            const baseUrl = `${req.protocol}://${req.get('host')}`;
            dto.image = `${baseUrl}/carousel/images/${uniqueName}`;
        }

        return this.carouselService.updateCarousel(id, dto);
    }

    //Eliminar un elemento del carrusel
    @Delete(':id')
    async deleteCarousel(@Param('id', ParseIntPipe) id: number) {
        return this.carouselService.deleteCarousel(id);
    }

    /**
     * Servir imágenes estáticas del carrusel
     */
    @Get('images/:filename')
    async serveImage(@Param('filename') filename: string, @Res() res: Response) {
        const imagePath = path.join(process.cwd(), 'src', 'uploads', 'carousel', filename);
        if (!fs.existsSync(imagePath)) {
            throw new BadRequestException('Imagen no encontrada');
        }
        res.sendFile(imagePath);
    }
}