// create-wholesale-link.dto.ts
import { IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateWholesaleLinkDto {
    @IsString()
    name: string;
    
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    discount?: number;
    
    @IsDateString()
    @IsOptional()
    expiresAt?: string;  // Cambiado a string para ISO date
    
    @IsString()
    @IsOptional()
    businessName?: string;
    
    @IsString()
    @IsOptional()
    notes?: string;
    
    @IsString()
    @IsOptional()
    createdBy?: string;
    
    @IsString()
    @IsOptional()
    customSlug?: string;
}