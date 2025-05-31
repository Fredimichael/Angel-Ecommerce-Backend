// src/wholesale/dto/get-links-query.dto.ts
import { IsOptional, IsBooleanString, IsString } from 'class-validator';

export class GetLinksQueryDto {
  @IsBooleanString()
  @IsOptional()
  active?: string = 'true';

  @IsString()
  @IsOptional()
  search?: string;
}