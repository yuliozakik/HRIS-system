import { ForbiddenException, Injectable } from '@nestjs/common';
import { AttendanceStatus, EmployeeStatus, LeaveStatus, Prisma } from '@prisma/client';
import * as ExcelJS from 'exceljs';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import dayjs from 'dayjs';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUser } from '../../common/types/auth-user';
import { RoleName } from '../../common/enums/role.enum';
import { ExportReportQueryDto } from './dto/export-report-query.dto';

function round4(value: number): number {
  return Math.round(value * 10000) / 10000;
}

interface ExportColumn {
  header: string;
  key: string;
  width: number;
}

interface ExportTable {
  columns: ExportColumn[];
  rows: Record<string, string | number>[];
}

@Injectable()
export class ReportService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(user: AuthenticatedUser) {
    const isManagerScoped = user.role === RoleName.MANAGER;
    if (isManagerScoped && !user.employeeId) {
      throw new ForbiddenException('Akun tidak terhubung dengan data karyawan');
    }

    const employeeWhere: Prisma.EmployeeWhereInput = isManagerScoped
      ? { managerId: user.employeeId as string }
      : {};

    const [totalEmployees, activeEmployees] = await Promise.all([
      this.prisma.employee.count({ where: employeeWhere }),
      this.prisma.employee.count({ where: { ...employeeWhere, status: EmployeeStatus.ACTIVE } }),
    ]);

    const departmentGroups = await this.prisma.employee.groupBy({
      by: ['departmentId'],
      where: { ...employeeWhere, status: EmployeeStatus.ACTIVE },
      _count: { _all: true },
    });
    const departmentIds = departmentGroups
      .map((g) => g.departmentId)
      .filter((id): id is string => !!id);
    const departments = departmentIds.length
      ? await this.prisma.department.findMany({
          where: { id: { in: departmentIds } },
          select: { id: true, name: true },
        })
      : [];
    const deptNameById = new Map(departments.map((d) => [d.id, d.name]));
    const employeesByDepartment = departmentGroups.map((g) => ({
      departmentName: g.departmentId ? (deptNameById.get(g.departmentId) ?? 'Unknown') : 'Unassigned',
      count: g._count._all,
    }));

    // --- Turnover rate YTD ---
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const resignedThisYear = await this.prisma.employee.count({
      where: {
        ...employeeWhere,
        status: EmployeeStatus.RESIGNED,
        updatedAt: { gte: yearStart, lte: now },
      },
    });
    const activeAtStartOfYear = await this.prisma.employee.count({
      where: {
        ...employeeWhere,
        hireDate: { lt: yearStart },
        OR: [
          { status: EmployeeStatus.ACTIVE },
          { status: EmployeeStatus.RESIGNED, updatedAt: { gte: yearStart } },
        ],
      },
    });
    const denominator = (activeAtStartOfYear + activeEmployees) / 2;
    const turnoverRateYtd = denominator === 0 ? 0 : round4(resignedThisYear / denominator);
    // --- end turnover rate ---

    const pendingLeaveRequests = await this.prisma.leaveRequest.count({
      where: {
        status: LeaveStatus.PENDING,
        ...(isManagerScoped ? { employee: { managerId: user.employeeId as string } } : {}),
      },
    });

    const latestRun = await this.prisma.payrollRun.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { period: true, status: true },
    });

    const monthStart = dayjs().startOf('month').toDate();
    const monthEnd = dayjs().endOf('month').toDate();
    const attendanceWhere: Prisma.AttendanceWhereInput = {
      date: { gte: monthStart, lte: monthEnd },
      ...(isManagerScoped ? { employee: { managerId: user.employeeId as string } } : {}),
    };
    const [lateAgg, totalAbsent] = await Promise.all([
      this.prisma.attendance.aggregate({ where: attendanceWhere, _sum: { lateMinutes: true } }),
      this.prisma.attendance.count({
        where: { ...attendanceWhere, status: AttendanceStatus.ABSENT },
      }),
    ]);

    return {
      totalEmployees,
      activeEmployees,
      employeesByDepartment,
      turnoverRateYtd,
      pendingLeaveRequests,
      latestPayrollRun: latestRun ?? null,
      attendanceThisMonth: {
        totalLate: lateAgg._sum.lateMinutes ?? 0,
        totalAbsent,
      },
    };
  }

  private async getExportTable(query: ExportReportQueryDto): Promise<ExportTable> {
    const monthStart = dayjs(`${query.period}-01`).startOf('month');
    const monthEnd = monthStart.endOf('month');

    if (query.type === 'payroll') {
      const columns: ExportColumn[] = [
        { header: 'Nama Karyawan', key: 'fullName', width: 30 },
        { header: 'Gaji Pokok', key: 'baseSalary', width: 18 },
        { header: 'Tunjangan', key: 'allowance', width: 18 },
        { header: 'Potongan', key: 'deductions', width: 18 },
        { header: 'Gaji Bersih', key: 'netPay', width: 18 },
      ];

      const run = await this.prisma.payrollRun.findUnique({ where: { period: query.period } });
      const rows: Record<string, string | number>[] = [];
      if (run) {
        const details = await this.prisma.payrollDetail.findMany({
          where: { payrollRunId: run.id },
          include: { employee: { select: { fullName: true } } },
          orderBy: { employee: { fullName: 'asc' } },
        });
        for (const d of details) {
          rows.push({
            fullName: d.employee.fullName,
            baseSalary: d.baseSalary.toNumber(),
            allowance: d.allowance.toNumber(),
            deductions: d.deductions.toNumber(),
            netPay: d.netPay.toNumber(),
          });
        }
      }
      return { columns, rows };
    }

    if (query.type === 'attendance') {
      const columns: ExportColumn[] = [
        { header: 'Nama Karyawan', key: 'fullName', width: 30 },
        { header: 'Tanggal', key: 'date', width: 14 },
        { header: 'Check In', key: 'checkIn', width: 18 },
        { header: 'Check Out', key: 'checkOut', width: 18 },
        { header: 'Terlambat (menit)', key: 'lateMinutes', width: 16 },
        { header: 'Lembur (menit)', key: 'overtimeMinutes', width: 16 },
        { header: 'Status', key: 'status', width: 12 },
      ];

      const attendanceRows = await this.prisma.attendance.findMany({
        where: { date: { gte: monthStart.toDate(), lte: monthEnd.toDate() } },
        include: { employee: { select: { fullName: true } } },
        orderBy: [{ date: 'asc' }],
      });
      const rows = attendanceRows.map((r) => ({
        fullName: r.employee.fullName,
        date: dayjs(r.date).format('YYYY-MM-DD'),
        checkIn: r.checkIn ? dayjs(r.checkIn).format('YYYY-MM-DD HH:mm') : '',
        checkOut: r.checkOut ? dayjs(r.checkOut).format('YYYY-MM-DD HH:mm') : '',
        lateMinutes: r.lateMinutes,
        overtimeMinutes: r.overtimeMinutes,
        status: r.status,
      }));
      return { columns, rows };
    }

    const columns: ExportColumn[] = [
      { header: 'Nama Karyawan', key: 'fullName', width: 30 },
      { header: 'Jenis Cuti', key: 'leaveType', width: 14 },
      { header: 'Tanggal Mulai', key: 'startDate', width: 16 },
      { header: 'Tanggal Selesai', key: 'endDate', width: 16 },
      { header: 'Status', key: 'status', width: 14 },
    ];

    const leaveRows = await this.prisma.leaveRequest.findMany({
      where: {
        startDate: { lte: monthEnd.toDate() },
        endDate: { gte: monthStart.toDate() },
      },
      include: { employee: { select: { fullName: true } } },
      orderBy: [{ startDate: 'asc' }],
    });
    const rows = leaveRows.map((r) => ({
      fullName: r.employee.fullName,
      leaveType: r.leaveType,
      startDate: dayjs(r.startDate).format('YYYY-MM-DD'),
      endDate: dayjs(r.endDate).format('YYYY-MM-DD'),
      status: r.status,
    }));
    return { columns, rows };
  }

  async buildExportWorkbook(query: ExportReportQueryDto): Promise<ExcelJS.Workbook> {
    const table = await this.getExportTable(query);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(query.type);
    sheet.columns = table.columns;
    for (const row of table.rows) {
      sheet.addRow(row);
    }
    sheet.getRow(1).font = { bold: true };
    return workbook;
  }

  async buildExportPdf(query: ExportReportQueryDto): Promise<Uint8Array> {
    const table = await this.getExportTable(query);

    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

    const pageSize: [number, number] = [841.89, 595.28]; // A4 landscape, more room for columns
    const marginX = 30;
    const rowHeight = 18;
    const colWidth = (pageSize[0] - marginX * 2) / table.columns.length;

    let page = doc.addPage(pageSize);
    let y = pageSize[1] - 50;

    const drawTitle = () => {
      page.drawText(`Laporan ${query.type} - Periode ${query.period}`, {
        x: marginX,
        y,
        size: 14,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      y -= 28;
    };

    const drawHeaderRow = () => {
      table.columns.forEach((col, i) => {
        page.drawText(col.header, {
          x: marginX + i * colWidth,
          y,
          size: 9,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
      });
      y -= rowHeight;
    };

    drawTitle();
    drawHeaderRow();

    for (const row of table.rows) {
      if (y < 40) {
        page = doc.addPage(pageSize);
        y = pageSize[1] - 50;
        drawHeaderRow();
      }
      table.columns.forEach((col, i) => {
        const value = row[col.key];
        page.drawText(value === undefined || value === null ? '' : String(value), {
          x: marginX + i * colWidth,
          y,
          size: 9,
          font,
          color: rgb(0, 0, 0),
        });
      });
      y -= rowHeight;
    }

    if (table.rows.length === 0) {
      page.drawText('Tidak ada data untuk periode ini.', {
        x: marginX,
        y,
        size: 10,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });
    }

    return doc.save();
  }
}
