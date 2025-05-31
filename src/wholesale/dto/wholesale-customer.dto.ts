import { IsString, IsEmail, IsOptional, IsPhoneNumber } from 'class-validator';

export class WholesaleCustomerDto {
    @IsString()
    token: string;
    
    @IsString()
    name: string;
    
    @IsEmail()
    email: string;
    
    @IsPhoneNumber() // Valida formato de teléfono
    phone: string;
    
    @IsString()
    @IsOptional()
    address?: string;
    
    @IsString()
    @IsOptional()
    businessName?: string;
    
    @IsString()
    @IsOptional()
    taxId?: string;
}