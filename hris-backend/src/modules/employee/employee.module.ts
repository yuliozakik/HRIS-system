import { Module } from '@nestjs/common';
import { DepartmentController } from './department.controller';
import { DepartmentService } from './department.service';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';
import { PositionController } from './position.controller';
import { PositionService } from './position.service';

@Module({
  controllers: [EmployeeController, DepartmentController, PositionController],
  providers: [EmployeeService, DepartmentService, PositionService],
  exports: [EmployeeService, DepartmentService, PositionService],
})
export class EmployeeModule {}
