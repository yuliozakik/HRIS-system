import { IsString, IsUUID } from 'class-validator';

export class CreatePositionDto {
  @IsString()
  title: string;

  @IsUUID()
  departmentId: string;
}
