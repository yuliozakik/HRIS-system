import { InjectQueue } from '@nestjs/bullmq';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PayrollRunStatus } from '@prisma/client';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUser } from '../../common/types/auth-user';
import { CreatePayrollRunDto } from './dto/create-payroll-run.dto';
import { PayrollJobData } from './payroll.processor';

@Injectable()
export class PayrollService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('payroll') private readonly payrollQueue: Queue<PayrollJobData>,
  ) {}

  async createRun(currentUser: AuthenticatedUser, dto: CreatePayrollRunDto) {
    const existing = await this.prisma.payrollRun.findUnique({
      where: { period: dto.period },
    });
    if (existing) {
      throw new BadRequestException(`Payroll run untuk periode ${dto.period} sudah ada`);
    }

    const run = await this.prisma.payrollRun.create({
      data: {
        period: dto.period,
        status: PayrollRunStatus.PROCESSING,
      },
    });

    await this.payrollQueue.add(
      'process-payroll-run',
      { payrollRunId: run.id, triggeredByUserId: currentUser.userId },
      {
        attempts: 1,
        removeOnComplete: 50,
        removeOnFail: 50,
      },
    );

    return run;
  }

  async findAll() {
    return this.prisma.payrollRun.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const run = await this.prisma.payrollRun.findUnique({
      where: { id },
      include: {
        details: {
          include: { employee: { select: { id: true, fullName: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!run) {
      throw new NotFoundException('Payroll run tidak ditemukan');
    }
    return run;
  }
}
