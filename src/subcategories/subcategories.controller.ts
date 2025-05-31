import { Controller, Get, Post, Body, Param, Delete, Put, UseInterceptors, BadRequestException, UploadedFile} from '@nestjs/common';
import { SubcategoriesService } from './subcategories.service';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join, extname } from 'path';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import * as sharp from 'sharp';


@Controller('subcategories')
export class SubcategoriesController {
  constructor(private readonly subcategoriesService: SubcategoriesService) {}

  //eliminar una subcategoría
  @Delete(':id')
  async deleteSubcategory(@Param('id') id: string) {
    return this.subcategoriesService.deleteSubcategory(id);
  }

  //editar una subcategoría
  @Put(':id')
  async updateSubcategory(@Param('id') id: string, @Body() createSubcategoryDto: CreateSubcategoryDto) {
    return this.subcategoriesService.updateSubcategory(id, createSubcategoryDto);
  }

  @Get()
  async getAllSubcategories() {
    return this.subcategoriesService.getAllSubcategories();
  }

  @Get(':id')
  async getSubcategoryById(@Param('id') id: string) {
    return this.subcategoriesService.getSubcategoryById(id);
  }

  @Get('category/:categoryId')
  async getSubcategoriesByCategoryId(@Param('categoryId') categoryId: string) {
    return this.subcategoriesService.getSubcategoriesByCategoryId(categoryId);
  }



  @Post('create')
@UseInterceptors(
  FileInterceptor('image', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = join(process.cwd(), 'src', 'uploads', 'subcategories');
        if (!existsSync(uploadPath)) {
          mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const filename = `${uniqueSuffix}${extname(file.originalname)}`; // Guardar con la extensión original
        cb(null, filename);
      },
    }),
  }),
)
async createSubcategory(@UploadedFile() file: Express.Multer.File, @Body() body: any) {

  if (!file) {
    throw new BadRequestException('No se ha subido ninguna imagen');
  }

  // Verificar que el categoryId esté presente
  if (!body.categoryId) {
    throw new BadRequestException('El categoryId es requerido');
  }

  // Ruta del archivo original subido
  const originalFilePath = file.path;

  // Generar un nombre único para el archivo WebP
  const webpFilename = `${file.filename.split('.')[0]}.webp`; // Cambiar la extensión a .webp
  const webpPath = join(process.cwd(), 'src', 'uploads', 'subcategories', webpFilename);

  try {
    // Convertir la imagen a WebP
    await sharp(originalFilePath) // Usar la ruta del archivo original
      .webp()
      .toFile(webpPath); // Guardar en una ruta diferente

    // Eliminar el archivo original después de la conversión
    unlinkSync(originalFilePath);

    // Crear el DTO con la URL de la imagen convertida
    const createSubcategoryDto = {
      name: body.name,
      image: `http://localhost:3000/uploads/subcategories/${webpFilename}`,
      categoryId: body.categoryId, // Asegúrate de que categoryId esté presente
    };

    // Guardar la subcategoría en la base de datos
    return this.subcategoriesService.createSubcategory(createSubcategoryDto);
  } catch (error) {
    // Si hay un error, eliminar el archivo subido y el archivo convertido (si existe)
    if (existsSync(originalFilePath)) {
      unlinkSync(originalFilePath);
    }
    if (existsSync(webpPath)) {
      unlinkSync(webpPath);
    }
    throw new BadRequestException('Error al procesar la imagen: ' + error.message);
  }
}
}
