import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class UpdateUserAccountDto {
  @IsOptional()
  @IsUUID()
  roleId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
