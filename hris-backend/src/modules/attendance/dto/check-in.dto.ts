import { IsNumber, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class CheckInDto {
  @IsOptional()
  @IsUUID()
  shiftId?: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng?: number;
}
