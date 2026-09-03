import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PayrollService } from './payroll.service';
import { CreatePayrollRunDto } from './dto/create-payroll-run.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleName } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/auth-user';

@ApiTags('payroll')
@Controller()
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Post('payroll-runs')
  @Roles(RoleName.HR_ADMIN, RoleName.SUPERADMIN)
  createRun(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePayrollRunDto) {
    return this.payrollService.createRun(user, dto);
  }

  @Get('payroll-runs')
  @Roles(RoleName.HR_ADMIN, RoleName.SUPERADMIN)
  findAll() {
    return this.payrollService.findAll();
  }

  @Get('payroll-runs/:id')
  @Roles(RoleName.HR_ADMIN, RoleName.SUPERADMIN)
  findOne(@Param('id') id: string) {
    return this.payrollService.findOne(id);
  }
}
