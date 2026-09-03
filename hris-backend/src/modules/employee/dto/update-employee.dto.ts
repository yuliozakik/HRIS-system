import { PartialType } from '@nestjs/swagger';
import { EmployeeStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CreateEmployeeDto } from './create-employee.dto';

/**
 * Broad DTO accepted by PATCH /employees/:id.
 * The service layer decides which of these fields a given caller is
 * actually allowed to apply (see EmployeeService.update): HR Admin /
 * Superadmin may set any field, while an employee updating their own
 * record is restricted to address/phone/email regardless of what is
 * sent here.
 */
export class UpdateEmployeeDto extends PartialType(CreateEmployeeDto) {
  @IsOptional()
  @IsEnum(EmployeeStatus)
  status?: EmployeeStatus;

  /** Optional note recorded on the EmployeeMutation row when position/department changes. */
  @IsOptional()
  @IsString()
  mutationNote?: string;
}
