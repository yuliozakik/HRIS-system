import { IsString, Matches } from 'class-validator';

const HHMM_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export class CreateShiftDto {
  @IsString()
  name: string;

  @Matches(HHMM_PATTERN, { message: 'startTime must be in HH:mm format' })
  startTime: string;

  @Matches(HHMM_PATTERN, { message: 'endTime must be in HH:mm format' })
  endTime: string;
}
