import { IsIn } from 'class-validator';
import { LeaveStatus } from '@prisma/client';

export type LeaveDecision = (typeof LeaveStatus)['APPROVED'] | (typeof LeaveStatus)['REJECTED'];

export class DecideLeaveRequestDto {
  @IsIn([LeaveStatus.APPROVED, LeaveStatus.REJECTED])
  status: LeaveDecision;
}
