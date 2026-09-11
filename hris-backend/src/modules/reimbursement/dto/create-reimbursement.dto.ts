import { IsEnum, IsNumber, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ReimbursementCategory } from '@prisma/client';

export class CreateReimbursementDto {
  @IsEnum(ReimbursementCategory)
  category: ReimbursementCategory;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
