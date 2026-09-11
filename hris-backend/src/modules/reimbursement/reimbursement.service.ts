import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ReimbursementStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.service';
import { NotificationService } from '../notification/notification.service';
import { RoleName } from '../../common/enums/role.enum';
import { AuthenticatedUser } from '../../common/types/auth-user';
import { CreateReimbursementDto } from './dto/create-reimbursement.dto';
import { DecideReimbursementDto } from './dto/decide-reimbursement.dto';

const OVERSIGHT_ROLES: RoleName[] = [RoleName.HR_ADMIN, RoleName.SUPERADMIN];

const idr = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' });

/** Minimal shape of a multer in-memory file (mirrors employee.service.ts). */
export interface UploadedMulterFile {
  originalname: string;
  buffer: Buffer;
  mimetype: string;
  size: number;
}

@Injectable()
export class ReimbursementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly notificationService: NotificationService,
  ) {}

  async create(
    currentUser: AuthenticatedUser,
    dto: CreateReimbursementDto,
    file: UploadedMulterFile | undefined,
  ) {
    const employeeId = currentUser.employeeId;
    if (!employeeId) {
      throw new ForbiddenException('Akun tidak terhubung dengan data karyawan');
    }

    let receiptUrl: string | undefined;
    if (file) {
      const key = `reimbursements/${employeeId}/${Date.now()}-${file.originalname}`;
      await this.storageService.upload(key, file.buffer, file.mimetype);
      receiptUrl = key;
    }

    const request = await this.prisma.reimbursementRequest.create({
      data: {
        employeeId,
        category: dto.category,
        amount: dto.amount,
        description: dto.description,
        receiptUrl,
        status: ReimbursementStatus.PENDING,
      },
    });

    try {
      const employee = await this.prisma.employee.findUnique({
        where: { id: employeeId },
        include: { manager: { include: { userAccount: true } } },
      });
      const managerEmail = employee?.manager?.userAccount?.email;
      if (managerEmail) {
        await this.notificationService.enqueue('generic', {
          to: managerEmail,
          subject: 'Pengajuan Reimbursement Baru',
          text: `Pengajuan reimbursement baru dari ${employee?.fullName ?? 'karyawan'} sebesar ${idr.format(
            dto.amount,
          )} menunggu persetujuan Anda.`,
        });
      }
    } catch {
      // Notification failures must not affect the already-committed request.
    }

    return request;
  }

  async findMany(currentUser: AuthenticatedUser, status?: ReimbursementStatus, scope?: string) {
    if (status && !Object.values(ReimbursementStatus).includes(status)) {
      throw new BadRequestException('Status tidak valid');
    }

    const where: Prisma.ReimbursementRequestWhereInput = {};
    if (status) {
      where.status = status;
    }

    if (scope === 'all') {
      if (!OVERSIGHT_ROLES.includes(currentUser.role)) {
        throw new ForbiddenException('Anda tidak memiliki akses untuk melihat semua pengajuan');
      }
    } else if (scope === 'team') {
      if (currentUser.role !== RoleName.MANAGER && !OVERSIGHT_ROLES.includes(currentUser.role)) {
        throw new ForbiddenException('Hanya manajer yang dapat melihat pengajuan tim');
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

    return this.prisma.reimbursementRequest.findMany({
      where,
      include: {
        employee: { select: { id: true, fullName: true, managerId: true } },
        approver: { select: { id: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async decide(currentUser: AuthenticatedUser, id: string, dto: DecideReimbursementDto) {
    const request = await this.prisma.reimbursementRequest.findUnique({
      where: { id },
      include: { employee: { include: { userAccount: true } } },
    });
    if (!request) {
      throw new NotFoundException('Pengajuan reimbursement tidak ditemukan');
    }

    const isDirectManager = request.employee.managerId === currentUser.employeeId;
    const isOverride = OVERSIGHT_ROLES.includes(currentUser.role);
    if (!isDirectManager && !isOverride) {
      throw new ForbiddenException('Anda tidak berwenang memproses pengajuan ini');
    }

    if (request.status !== ReimbursementStatus.PENDING) {
      throw new BadRequestException('Pengajuan sudah diproses sebelumnya');
    }

    const updated = await this.prisma.reimbursementRequest.update({
      where: { id },
      data: {
        status: dto.status,
        approverId: currentUser.userId,
        decidedAt: new Date(),
      },
    });

    try {
      const employeeEmail = request.employee.userAccount?.email;
      if (employeeEmail) {
        const approved = dto.status === ReimbursementStatus.APPROVED;
        await this.notificationService.enqueue('generic', {
          to: employeeEmail,
          subject: approved ? 'Reimbursement Disetujui' : 'Reimbursement Ditolak',
          text: approved
            ? `Pengajuan reimbursement Anda sebesar ${idr.format(Number(request.amount))} telah disetujui.`
            : `Pengajuan reimbursement Anda sebesar ${idr.format(Number(request.amount))} telah ditolak.`,
        });
      }
    } catch {
      // Notification failures must not affect the already-committed decision.
    }

    return updated;
  }

  async cancel(currentUser: AuthenticatedUser, id: string) {
    const request = await this.prisma.reimbursementRequest.findUnique({ where: { id } });
    if (!request) {
      throw new NotFoundException('Pengajuan reimbursement tidak ditemukan');
    }
    if (request.employeeId !== currentUser.employeeId) {
      throw new ForbiddenException('Anda hanya dapat membatalkan pengajuan Anda sendiri');
    }
    if (request.status !== ReimbursementStatus.PENDING) {
      throw new BadRequestException('Hanya pengajuan berstatus pending yang dapat dibatalkan');
    }

    return this.prisma.reimbursementRequest.update({
      where: { id },
      data: { status: ReimbursementStatus.CANCELLED, decidedAt: new Date() },
    });
  }

  private assertCanAccessReceipt(currentUser: AuthenticatedUser, employeeId: string, managerId: string | null) {
    const isSelf = currentUser.employeeId === employeeId;
    const isManager = managerId === currentUser.employeeId;
    const isOverride = OVERSIGHT_ROLES.includes(currentUser.role);
    if (!isSelf && !isManager && !isOverride) {
      throw new ForbiddenException('Anda tidak berwenang mengakses bukti pengeluaran ini');
    }
  }

  async getReceipt(currentUser: AuthenticatedUser, id: string) {
    const request = await this.prisma.reimbursementRequest.findUnique({
      where: { id },
      include: { employee: { select: { managerId: true } } },
    });
    if (!request || !request.receiptUrl) {
      throw new NotFoundException('Bukti pengeluaran tidak ditemukan');
    }
    this.assertCanAccessReceipt(currentUser, request.employeeId, request.employee.managerId);

    const buffer = await this.storageService.download(request.receiptUrl);
    const filename = request.receiptUrl.split('/').pop() ?? 'receipt';
    return { buffer, filename };
  }
}
