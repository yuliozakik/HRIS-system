import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { PayrollController } from './payroll.controller';
import { PayslipController } from './payslip.controller';
import { PayrollService } from './payroll.service';
import { PayslipService } from './payslip.service';
import { PayrollProcessor } from './payroll.processor';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [BullModule.registerQueue({ name: 'payroll' }), NotificationModule],
  controllers: [PayrollController, PayslipController],
  providers: [PayrollService, PayslipService, PayrollProcessor],
})
export class PayrollModule {}
