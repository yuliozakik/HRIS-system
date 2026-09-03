import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import dayjs from 'dayjs';
import { AttendanceStatus, EmployeeStatus, PayrollRunStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.service';
import { NotificationService } from '../notification/notification.service';

export interface PayrollJobData {
  payrollRunId: string;
  /** UserAccount id of the HR admin who triggered the run, if known. */
  triggeredByUserId?: string;
}

const idr = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' });

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

interface PayslipPdfInput {
  employeeName: string;
  period: string;
  baseSalary: number;
  allowance: number;
  lateDeduction: number;
  absentDeduction: number;
  deductions: number;
  grossPay: number;
  netPay: number;
  totalLateMinutes: number;
  absentDays: number;
}

@Processor('payroll')
export class PayrollProcessor extends WorkerHost {
  private readonly logger = new Logger(PayrollProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly notificationService: NotificationService,
  ) {
    super();
  }

  async process(job: Job<PayrollJobData>): Promise<void> {
    const { payrollRunId, triggeredByUserId } = job.data;
    this.logger.log(`Processing payroll run ${payrollRunId}`);

    const run = await this.prisma.payrollRun.findUnique({ where: { id: payrollRunId } });
    if (!run) {
      this.logger.error(`Payroll run ${payrollRunId} not found, skipping job`);
      return;
    }

    try {
      const monthStart = dayjs(`${run.period}-01`).startOf('month');
      const monthEnd = monthStart.endOf('month');

      const employees = await this.prisma.employee.findMany({
        where: { status: EmployeeStatus.ACTIVE },
        include: { userAccount: { select: { email: true } } },
      });

      for (const employee of employees) {
        const attendances = await this.prisma.attendance.findMany({
          where: {
            employeeId: employee.id,
            date: { gte: monthStart.toDate(), lte: monthEnd.toDate() },
          },
          select: { lateMinutes: true, status: true },
        });

        const totalLateMinutes = attendances.reduce((sum, a) => sum + a.lateMinutes, 0);
        const absentDays = attendances.filter((a) => a.status === AttendanceStatus.ABSENT).length;

        const baseSalary = employee.baseSalary.toNumber();
        const allowance = employee.allowance.toNumber();

        // --- Payroll formula (FR-PAY-02) ---
        const dailyRate = baseSalary / 22; // 22 working days/month approximation
        const hourlyRate = dailyRate / 8;
        const lateDeduction = (totalLateMinutes / 60) * hourlyRate;
        const absentDeduction = absentDays * dailyRate;
        const deductions = round2(lateDeduction + absentDeduction);
        const grossPay = baseSalary + allowance;
        const netPay = grossPay - deductions;
        // --- end formula ---

        const pdfBytes = await this.generatePayslipPdf({
          employeeName: employee.fullName,
          period: run.period,
          baseSalary,
          allowance,
          lateDeduction: round2(lateDeduction),
          absentDeduction: round2(absentDeduction),
          deductions,
          grossPay,
          netPay,
          totalLateMinutes,
          absentDays,
        });

        const payslipKey = `payslips/${payrollRunId}/${employee.id}.pdf`;
        await this.storageService.upload(payslipKey, Buffer.from(pdfBytes), 'application/pdf');

        await this.prisma.payrollDetail.upsert({
          where: {
            payrollRunId_employeeId: { payrollRunId, employeeId: employee.id },
          },
          create: {
            payrollRunId,
            employeeId: employee.id,
            baseSalary,
            allowance,
            grossPay,
            deductions,
            netPay,
            payslipUrl: payslipKey,
          },
          update: {
            baseSalary,
            allowance,
            grossPay,
            deductions,
            netPay,
            payslipUrl: payslipKey,
          },
        });

        if (employee.userAccount?.email) {
          try {
            await this.notificationService.enqueue('payroll-completed', {
              to: employee.userAccount.email,
              subject: `Slip Gaji Periode ${run.period} Tersedia`,
              text: `Halo ${employee.fullName}, slip gaji Anda untuk periode ${run.period} telah tersedia. Gaji bersih: ${idr.format(netPay)}.`,
            });
          } catch (err) {
            this.logger.warn(
              `Failed to enqueue payroll-completed notification for employee ${employee.id}: ${(err as Error).message}`,
            );
          }
        }
      }

      await this.prisma.payrollRun.update({
        where: { id: payrollRunId },
        data: { status: PayrollRunStatus.COMPLETED, processedAt: new Date() },
      });

      try {
        const trigger = triggeredByUserId
          ? await this.prisma.userAccount.findUnique({ where: { id: triggeredByUserId } })
          : null;
        const hrAdmin =
          trigger ??
          (await this.prisma.userAccount.findFirst({
            where: { isActive: true, role: { name: 'HR_ADMIN' } },
          }));
        if (hrAdmin?.email) {
          await this.notificationService.enqueue('generic', {
            to: hrAdmin.email,
            subject: `Proses Payroll Periode ${run.period} Selesai`,
            text: `Proses payroll untuk periode ${run.period} telah selesai. ${employees.length} karyawan aktif telah diproses.`,
          });
        }
      } catch (err) {
        this.logger.warn(`Failed to enqueue payroll summary notification: ${(err as Error).message}`);
      }
    } catch (err) {
      this.logger.error(`Payroll run ${payrollRunId} failed: ${(err as Error).message}`);
      await this.prisma.payrollRun.update({
        where: { id: payrollRunId },
        data: { status: PayrollRunStatus.FAILED },
      });
      throw err;
    }
  }

  private async generatePayslipPdf(input: PayslipPdfInput): Promise<Uint8Array> {
    const doc = await PDFDocument.create();
    const page = doc.addPage([595.28, 841.89]); // A4 portrait
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

    let y = 800;
    const drawLine = (text: string, opts: { bold?: boolean; size?: number } = {}) => {
      const size = opts.size ?? 11;
      page.drawText(text, {
        x: 50,
        y,
        size,
        font: opts.bold ? boldFont : font,
        color: rgb(0, 0, 0),
      });
      y -= size + 8;
    };

    drawLine('HRIS - Slip Gaji', { bold: true, size: 18 });
    drawLine(`Periode: ${input.period}`);
    y -= 6;
    drawLine(`Nama Karyawan: ${input.employeeName}`, { bold: true, size: 13 });
    y -= 12;

    drawLine('Rincian Pendapatan', { bold: true, size: 13 });
    drawLine(`Gaji Pokok: ${idr.format(input.baseSalary)}`);
    drawLine(`Tunjangan: ${idr.format(input.allowance)}`);
    drawLine(`Gaji Kotor (Gross Pay): ${idr.format(input.grossPay)}`);
    y -= 6;

    drawLine('Rincian Potongan', { bold: true, size: 13 });
    drawLine(`Keterlambatan (${input.totalLateMinutes} menit): ${idr.format(input.lateDeduction)}`);
    drawLine(`Ketidakhadiran (${input.absentDays} hari): ${idr.format(input.absentDeduction)}`);
    drawLine(`Total Potongan: ${idr.format(input.deductions)}`);
    y -= 10;

    drawLine(`Gaji Bersih (Net Pay): ${idr.format(input.netPay)}`, { bold: true, size: 14 });

    return doc.save();
  }
}
