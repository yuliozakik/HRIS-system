import { Module } from '@nestjs/common';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { ShiftController } from './shift.controller';
import { ShiftService } from './shift.service';

@Module({
  controllers: [AttendanceController, ShiftController],
  providers: [AttendanceService, ShiftService],
  exports: [AttendanceService, ShiftService],
})
export class AttendanceModule {}
