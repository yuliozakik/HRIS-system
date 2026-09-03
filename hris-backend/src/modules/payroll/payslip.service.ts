import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.service';
import { AuthenticatedUser } from '../../common/types/auth-user';
import { RoleName } from '../../common/enums/role.enum';

const OVERSIGHT_ROLES: RoleName[] = [RoleName.HR_ADMIN, RoleName.SUPERADMIN];

@Injectable()
export class PayslipService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  private assertAccess(user: AuthenticatedUser, employeeId: string) {
    const isSelf = user.employeeId === employeeId;
    const isOverride = OVERSIGHT_ROLES.includes(user.role);
    if (!isSelf && !isOverride) {
      throw new ForbiddenException('Anda tidak berwenang mengakses slip gaji karyawan ini');
    }
  }

  async listForEmployee(user: AuthenticatedUser, employeeId: string) {
    this.assertAccess(user, employeeId);

    const details = await this.prisma.payrollDetail.findMany({
      where: { employeeId },
      include: { payrollRun: { select: { id: true, period: true, status: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return details.map((d) => ({
      id: d.id,
      payrollRunId: d.payrollRunId,
      period: d.payrollRun.period,
      runStatus: d.payrollRun.status,
      baseSalary: d.baseSalary,
      allowance: d.allowance,
      grossPay: d.grossPay,
      deductions: d.deductions,
      netPay: d.netPay,
      hasPdf: !!d.payslipUrl,
    }));
  }

  async getPdf(user: AuthenticatedUser, employeeId: string, payrollDetailId: string) {
    this.assertAccess(user, employeeId);

    const detail = await this.prisma.payrollDetail.findUnique({
      where: { id: payrollDetailId },
      include: { payrollRun: { select: { period: true } } },
    });

    if (!detail || detail.employeeId !== employeeId || !detail.payslipUrl) {
      throw new NotFoundException('Slip gaji tidak ditemukan');
    }

    const buffer = await this.storageService.download(detail.payslipUrl);
    return {
      buffer,
      filename: `payslip-${detail.payrollRun.period}-${employeeId}.pdf`,
    };
  }
}
