import { IsIn } from 'class-validator';
import { LeaveStatus } from '@prisma/client';

export type LeaveDecision = LeaveStatus.APPROVED | LeaveStatus.REJECTED;

export class DecideLeaveRequestDto {
  @IsIn([LeaveStatus.APPROVED, LeaveStatus.REJECTED])
  status: LeaveDecision;
}
