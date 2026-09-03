import { Matches } from 'class-validator';

export class CreatePayrollRunDto {
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'period harus berformat YYYY-MM (contoh: 2026-09)',
  })
  period: string;
}
