import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LeaveStatus, LeaveType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { RoleName } from '../../common/enums/role.enum';
import { AuthenticatedUser } from '../../common/types/auth-user';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { DecideLeaveRequestDto } from './dto/decide-leave-request.dto';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Leave types that consume the employee's yearly leave balance. */
const BALANCE_CONSUMING_TYPES: LeaveType[] = [LeaveType.ANNUAL, LeaveType.SICK];

const OVERSIGHT_ROLES: RoleName[] = [RoleName.HR_ADMIN, RoleName.SUPERADMIN];

function calculateLeaveDays(startDate: Date, endDate: Date): number {
  return Math.round((endDate.getTime() - startDate.getTime()) / MS_PER_DAY) + 1;
}

function consumesBalance(leaveType: LeaveType): boolean {
  return BALANCE_CONSUMING_TYPES.includes(leaveType);
}

@Injectable()
export class LeaveService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async createLeaveRequest(currentUser: AuthenticatedUser, dto: CreateLeaveRequestDto) {
    const employeeId = currentUser.employeeId;
    if (!employeeId) {
      throw new ForbiddenException('Akun tidak terhubung dengan data karyawan');
    }

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    if (endDate.getTime() < startDate.getTime()) {
      throw new BadRequestException('Tanggal selesai harus sama atau setelah tanggal mulai');
    }

    const days = calculateLeaveDays(startDate, endDate);
    const year = startDate.getFullYear();

    const leaveRequest = await this.prisma.$transaction(async (tx) => {
      if (consumesBalance(dto.leaveType)) {
        const balance = await tx.leaveBalance.findUnique({
          where: {
            employeeId_year_leaveType: {
              employeeId,
              year,
              leaveType: dto.leaveType,
            },
          },
        });

        if (!balance || balance.balance < days) {
          throw new BadRequestException('Saldo cuti tidak mencukupi');
        }

        await tx.leaveBalance.update({
          where: { id: balance.id },
          data: { balance: { decrement: days } },
        });
      }

      return tx.leaveRequest.create({
        data: {
          employeeId,
          leaveType: dto.leaveType,
          startDate,
          endDate,
          reason: dto.reason,
          status: LeaveStatus.PENDING,
        },
      });
    });

    // Fire-and-await notification enqueue; never block/fail the request on this.
    try {
      const employee = await this.prisma.employee.findUnique({
        where: { id: employeeId },
        include: { manager: { include: { userAccount: true } } },
      });

      const managerEmail = employee?.manager?.userAccount?.email;
      if (managerEmail) {
        await this.notificationService.enqueue('leave-submitted', {
          to: managerEmail,
          subject: 'Pengajuan Cuti Baru',
          text: `Pengajuan cuti baru dari ${employee?.fullName ?? 'karyawan'} menunggu persetujuan Anda`,
        });
      }
    } catch {
      // Notification failures must not affect the already-committed leave request.
    }

    return leaveRequest;
  }

  async findLeaveRequests(
    currentUser: AuthenticatedUser,
    status?: LeaveStatus,
    scope?: string,
  ) {
    if (status && !Object.values(LeaveStatus).includes(status)) {
      throw new BadRequestException('Status tidak valid');
    }

    const where: Prisma.LeaveRequestWhereInput = {};
    if (status) {
      where.status = status;
    }

    if (scope === 'all') {
      if (!OVERSIGHT_ROLES.includes(currentUser.role)) {
        throw new ForbiddenException('Anda tidak memiliki akses untuk melihat semua pengajuan cuti');
      }
      // No employee filter: HR/superadmin see every request.
    } else if (scope === 'team') {
      if (currentUser.role !== RoleName.MANAGER && !OVERSIGHT_ROLES.includes(currentUser.role)) {
        throw new ForbiddenException('Hanya manajer yang dapat melihat pengajuan cuti tim');
      }
      if (!currentUser.employeeId) {
        throw new ForbiddenException('Akun tidak terhubung dengan data karyawan');
      }
      where.employee = { managerId: currentUser.employeeId };
    } else {
      if (!currentUser.employeeId) {
        throw new ForbiddenException('Akun tidak terhubung dengan data karyawan');
      }
      where.employeeId = currentUser.employeeId;
    }

    return this.prisma.leaveRequest.findMany({
      where,
      include: {
        employee: { select: { id: true, fullName: true, managerId: true } },
        approver: { select: { id: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async decideLeaveRequest(
    currentUser: AuthenticatedUser,
    id: string,
    dto: DecideLeaveRequestDto,
  ) {
    const leaveRequest = await this.prisma.leaveRequest.findUnique({
      where: { id },
      include: { employee: { include: { userAccount: true } } },
    });
    if (!leaveRequest) {
      throw new NotFoundException('Pengajuan cuti tidak ditemukan');
    }

    const isDirectManager = leaveRequest.employee.managerId === currentUser.employeeId;
    const isOverride = OVERSIGHT_ROLES.includes(currentUser.role);
    if (!isDirectManager && !isOverride) {
      throw new ForbiddenException('Anda tidak berwenang memproses pengajuan cuti ini');
    }

    if (leaveRequest.status !== LeaveStatus.PENDING) {
      throw new BadRequestException('Pengajuan cuti sudah diproses sebelumnya');
    }

    const days = calculateLeaveDays(leaveRequest.startDate, leaveRequest.endDate);
    const year = leaveRequest.startDate.getFullYear();

    const updated = await this.prisma.$transaction(async (tx) => {
      if (dto.status === LeaveStatus.REJECTED && consumesBalance(leaveRequest.leaveType)) {
        await tx.leaveBalance.update({
          where: {
            employeeId_year_leaveType: {
              employeeId: leaveRequest.employeeId,
              year,
              leaveType: leaveRequest.leaveType,
            },
          },
          data: { balance: { increment: days } },
        });
      }

      return tx.leaveRequest.update({
        where: { id },
        data: {
          status: dto.status,
          approverId: currentUser.userId,
          decidedAt: new Date(),
        },
      });
    });

    try {
      const employeeEmail = leaveRequest.employee.userAccount?.email;
      if (employeeEmail) {
        const approved = dto.status === LeaveStatus.APPROVED;
        await this.notificationService.enqueue('leave-decided', {
          to: employeeEmail,
          subject: approved ? 'Pengajuan Cuti Disetujui' : 'Pengajuan Cuti Ditolak',
          text: approved
            ? `Pengajuan cuti Anda tanggal ${leaveRequest.startDate.toISOString().slice(0, 10)} s/d ${leaveRequest.endDate.toISOString().slice(0, 10)} telah disetujui.`
            : `Pengajuan cuti Anda tanggal ${leaveRequest.startDate.toISOString().slice(0, 10)} s/d ${leaveRequest.endDate.toISOString().slice(0, 10)} telah ditolak.`,
        });
      }
    } catch {
      // Notification failures must not affect the already-committed decision.
    }

    return updated;
  }

  async cancelLeaveRequest(currentUser: AuthenticatedUser, id: string) {
    const leaveRequest = await this.prisma.leaveRequest.findUnique({ where: { id } });
    if (!leaveRequest) {
      throw new NotFoundException('Pengajuan cuti tidak ditemukan');
    }

    if (leaveRequest.employeeId !== currentUser.employeeId) {
      throw new ForbiddenException('Anda hanya dapat membatalkan pengajuan cuti Anda sendiri');
    }

    if (leaveRequest.status !== LeaveStatus.PENDING) {
      throw new BadRequestException('Hanya pengajuan cuti berstatus pending yang dapat dibatalkan');
    }

    const days = calculateLeaveDays(leaveRequest.startDate, leaveRequest.endDate);
    const year = leaveRequest.startDate.getFullYear();

    return this.prisma.$transaction(async (tx) => {
      if (consumesBalance(leaveRequest.leaveType)) {
        await tx.leaveBalance.update({
          where: {
            employeeId_year_leaveType: {
              employeeId: leaveRequest.employeeId,
              year,
              leaveType: leaveRequest.leaveType,
            },
          },
          data: { balance: { increment: days } },
        });
      }

      return tx.leaveRequest.update({
        where: { id },
        data: {
          status: LeaveStatus.CANCELLED,
          decidedAt: new Date(),
        },
      });
    });
  }

  async getLeaveBalances(currentUser: AuthenticatedUser, employeeId: string, year?: number) {
    const employee = await this.prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) {
      throw new NotFoundException('Karyawan tidak ditemukan');
    }

    const isSelf = currentUser.employeeId === employeeId;
    const isManager = employee.managerId === currentUser.employeeId;
    const isOverride = OVERSIGHT_ROLES.includes(currentUser.role);
    if (!isSelf && !isManager && !isOverride) {
      throw new ForbiddenException('Anda tidak berwenang melihat saldo cuti karyawan ini');
    }

    if (year !== undefined && Number.isNaN(year)) {
      throw new BadRequestException('Parameter year tidak valid');
    }
    const targetYear = year ?? new Date().getFullYear();

    return this.prisma.leaveBalance.findMany({
      where: { employeeId, year: targetYear },
      orderBy: { leaveType: 'asc' },
    });
  }
}
