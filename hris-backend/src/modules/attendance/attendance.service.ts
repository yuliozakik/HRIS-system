import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { AttendanceStatus, Prisma } from '@prisma/client';
import dayjs from 'dayjs';
import { PrismaService } from '../../prisma/prisma.service';
import { RoleName } from '../../common/enums/role.enum';
import { AuthenticatedUser } from '../../common/types/auth-user';
import { CheckInDto } from './dto/check-in.dto';
import { QueryAttendanceDto } from './dto/query-attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async checkIn(user: AuthenticatedUser, dto: CheckInDto) {
    const employeeId = this.requireEmployeeId(user);
    const today = dayjs().startOf('day').toDate();
    const now = new Date();

    const existing = await this.prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId, date: today } },
    });
    if (existing?.checkIn) {
      throw new BadRequestException('You have already checked in today');
    }

    let shiftId: string | null = dto.shiftId ?? null;
    let status: AttendanceStatus = AttendanceStatus.ON_TIME;
    let lateMinutes = 0;

    if (shiftId) {
      const shift = await this.prisma.shift.findUnique({ where: { id: shiftId } });
      if (!shift) {
        throw new BadRequestException('Shift not found');
      }
      const shiftStart = this.buildTimeOnDate(today, shift.startTime);
      lateMinutes = Math.max(0, dayjs(now).diff(dayjs(shiftStart), 'minute'));
      status = lateMinutes > 0 ? AttendanceStatus.LATE : AttendanceStatus.ON_TIME;
    }

    return this.prisma.attendance.upsert({
      where: { employeeId_date: { employeeId, date: today } },
      create: {
        employeeId,
        date: today,
        shiftId,
        checkIn: now,
        status,
        lateMinutes,
      },
      update: {
        shiftId,
        checkIn: now,
        status,
        lateMinutes,
      },
    });
  }

  async checkOut(user: AuthenticatedUser) {
    const employeeId = this.requireEmployeeId(user);
    const today = dayjs().startOf('day').toDate();
    const now = new Date();

    const existing = await this.prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId, date: today } },
    });
    if (!existing || !existing.checkIn) {
      throw new BadRequestException('You must check in before checking out');
    }
    if (existing.checkOut) {
      throw new BadRequestException('You have already checked out today');
    }

    let overtimeMinutes = existing.overtimeMinutes;
    if (existing.shiftId) {
      const shift = await this.prisma.shift.findUnique({ where: { id: existing.shiftId } });
      if (shift) {
        const shiftEnd = this.buildTimeOnDate(today, shift.endTime);
        overtimeMinutes = Math.max(0, dayjs(now).diff(dayjs(shiftEnd), 'minute'));
      }
    }

    return this.prisma.attendance.update({
      where: { id: existing.id },
      data: { checkOut: now, overtimeMinutes },
    });
  }

  async findMine(user: AuthenticatedUser, query: QueryAttendanceDto) {
    const employeeId = this.requireEmployeeId(user);
    const to = query.to ? dayjs(query.to).endOf('day') : dayjs().endOf('day');
    const from = query.from ? dayjs(query.from).startOf('day') : to.subtract(30, 'day').startOf('day');

    return this.prisma.attendance.findMany({
      where: {
        employeeId,
        date: { gte: from.toDate(), lte: to.toDate() },
      },
      include: { shift: true },
      orderBy: { date: 'desc' },
    });
  }

  async findTeam(user: AuthenticatedUser, query: QueryAttendanceDto) {
    if (user.role === RoleName.MANAGER && !user.employeeId) {
      throw new ForbiddenException('No employee record linked to this account');
    }

    const to = query.to ? dayjs(query.to).endOf('day') : dayjs().endOf('month');
    const from = query.from ? dayjs(query.from).startOf('day') : dayjs().startOf('month');

    const where: Prisma.AttendanceWhereInput = {
      date: { gte: from.toDate(), lte: to.toDate() },
    };
    if (user.role === RoleName.MANAGER) {
      where.employee = { managerId: user.employeeId };
    }

    return this.prisma.attendance.findMany({
      where,
      include: {
        employee: { select: { id: true, fullName: true, nik: true, managerId: true } },
        shift: true,
      },
      orderBy: [{ date: 'desc' }, { employee: { fullName: 'asc' } }],
    });
  }

  private requireEmployeeId(user: AuthenticatedUser): string {
    if (!user.employeeId) {
      throw new ForbiddenException('No employee record linked to this account');
    }
    return user.employeeId;
  }

  private buildTimeOnDate(date: Date, hhmm: string): Date {
    const [hours, minutes] = hhmm.split(':').map(Number);
    return dayjs(date).hour(hours).minute(minutes).second(0).millisecond(0).toDate();
  }
}
