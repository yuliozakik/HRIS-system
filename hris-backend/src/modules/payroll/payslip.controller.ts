import { Controller, Get, Param, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { PayslipService } from './payslip.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/auth-user';

@ApiTags('payslips')
@Controller()
export class PayslipController {
  constructor(private readonly payslipService: PayslipService) {}

  @Get('payslips/:employeeId')
  listPayslips(@CurrentUser() user: AuthenticatedUser, @Param('employeeId') employeeId: string) {
    return this.payslipService.listForEmployee(user, employeeId);
  }

  @Get('payslips/:employeeId/:payrollDetailId/pdf')
  async downloadPayslip(
    @CurrentUser() user: AuthenticatedUser,
    @Param('employeeId') employeeId: string,
    @Param('payrollDetailId') payrollDetailId: string,
    @Res({ passthrough: false }) res: Response,
  ): Promise<void> {
    const { buffer, filename } = await this.payslipService.getPdf(
      user,
      employeeId,
      payrollDetailId,
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }
}
