import { IsDateString, IsOptional } from 'class-validator';

export class QueryAttendanceDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
