import { Module } from '@nestjs/common';
import { ReimbursementController } from './reimbursement.controller';
import { ReimbursementService } from './reimbursement.service';

@Module({
  controllers: [ReimbursementController],
  providers: [ReimbursementService],
})
export class ReimbursementModule {}
