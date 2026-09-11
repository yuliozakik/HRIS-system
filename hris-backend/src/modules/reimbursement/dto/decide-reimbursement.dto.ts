import { IsIn } from 'class-validator';
import { ReimbursementStatus } from '@prisma/client';

export type ReimbursementDecision =
  | (typeof ReimbursementStatus)['APPROVED']
  | (typeof ReimbursementStatus)['REJECTED'];

export class DecideReimbursementDto {
  @IsIn([ReimbursementStatus.APPROVED, ReimbursementStatus.REJECTED])
  status: ReimbursementDecision;
}
