import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { ReportService } from './report.service';
import { ExportReportQueryDto } from './dto/export-report-query.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleName } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/auth-user';

@ApiTags('reports')
@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('summary')
  @Roles(RoleName.HR_ADMIN, RoleName.SUPERADMIN, RoleName.MANAGER)
  getSummary(@CurrentUser() user: AuthenticatedUser) {
    return this.reportService.getSummary(user);
  }

  @Get('export')
  @Roles(RoleName.HR_ADMIN, RoleName.SUPERADMIN)
  async exportReport(
    @Query() query: ExportReportQueryDto,
    @Res({ passthrough: false }) res: Response,
  ): Promise<void> {
    if (query.format === 'pdf') {
      const pdfBytes = await this.reportService.buildExportPdf(query);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="report-${query.type}-${query.period}.pdf"`,
      );
      res.send(Buffer.from(pdfBytes));
      return;
    }

    const workbook = await this.reportService.buildExportWorkbook(query);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="report-${query.type}-${query.period}.xlsx"`,
    );
    await workbook.xlsx.write(res);
    res.end();
  }
}
