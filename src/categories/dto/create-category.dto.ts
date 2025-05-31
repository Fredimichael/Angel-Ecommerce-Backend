import { IsString, IsArray, IsOptional } from 'class-validator';

export class CreateCategoryDto {
    @IsString()
    name: string;

    @IsString()
    image: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    subcategories?: string[];
}