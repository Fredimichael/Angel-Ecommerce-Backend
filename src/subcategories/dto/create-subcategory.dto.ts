import { IsString, IsNotEmpty } from 'class-validator';

export class CreateSubcategoryDto {
    @IsString()
    @IsNotEmpty({ message: 'El nombre es requerido' })
    name: string;

    @IsString()
    @IsNotEmpty({ message: 'La imagen es requerida' })
    image: string;

    @IsString()
    @IsNotEmpty({ message: 'El ID de la categoría es requerido' })
    categoryId: string;
}
