import { IsIn, Matches } from 'class-validator';

export type ReportExportType = 'attendance' | 'leave' | 'payroll';

export class ExportReportQueryDto {
  @IsIn(['attendance', 'leave', 'payroll'])
  type: ReportExportType;

  @IsIn(['excel'])
  format: 'excel';

  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'period harus berformat YYYY-MM (contoh: 2026-09)',
  })
  period: string;
}
