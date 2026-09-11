import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EmployeeStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.service';
import { RoleName } from '../../common/enums/role.enum';
import { AuthenticatedUser } from '../../common/types/auth-user';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { QueryEmployeeDto } from './dto/query-employee.dto';

/**
 * Minimal shape of a multer in-memory file, kept local so this module does
 * not depend on @types/multer being installed separately.
 */
export interface UploadedMulterFile {
  originalname: string;
  buffer: Buffer;
  mimetype: string;
  size: number;
}

const SELF_UPDATABLE_FIELDS = ['address', 'phone', 'email'] as const;

@Injectable()
export class EmployeeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async list(user: AuthenticatedUser, query: QueryEmployeeDto) {
    const andConditions: Prisma.EmployeeWhereInput[] = [];

    if (query.departmentId) {
      andConditions.push({ departmentId: query.departmentId });
    }
    if (query.status) {
      andConditions.push({ status: query.status });
    }
    if (query.search) {
      andConditions.push({
        OR: [
          { fullName: { contains: query.search, mode: 'insensitive' } },
          { nik: { contains: query.search, mode: 'insensitive' } },
        ],
      });
    }

    if (user.role === RoleName.MANAGER) {
      andConditions.push({
        OR: [{ managerId: user.employeeId ?? '__none__' }, { id: user.employeeId ?? '__none__' }],
      });
    }

    const where: Prisma.EmployeeWhereInput = andConditions.length ? { AND: andConditions } : {};

    return this.prisma.employee.findMany({
      where,
      include: { department: true, position: true },
      orderBy: { fullName: 'asc' },
    });
  }

  /**
   * Read-only company directory, open to every authenticated role. Only
   * exposes work-relevant fields (name, department, position, email) — no
   * NIK, salary, address, or phone.
   */
  async directory(search?: string) {
    const where: Prisma.EmployeeWhereInput = { status: EmployeeStatus.ACTIVE };
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { position: { title: { contains: search, mode: 'insensitive' } } },
        { department: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const employees = await this.prisma.employee.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        email: true,
        department: { select: { name: true } },
        position: { select: { title: true } },
        manager: { select: { id: true, fullName: true } },
      },
      orderBy: { fullName: 'asc' },
    });

    return employees;
  }

  async create(dto: CreateEmployeeDto) {
    const existing = await this.prisma.employee.findUnique({ where: { nik: dto.nik } });
    if (existing) {
      throw new BadRequestException(`Employee with NIK "${dto.nik}" already exists`);
    }

    return this.prisma.$transaction(async (tx) => {
      const employee = await tx.employee.create({
        data: {
          nik: dto.nik,
          fullName: dto.fullName,
          address: dto.address,
          phone: dto.phone,
          email: dto.email,
          departmentId: dto.departmentId,
          positionId: dto.positionId,
          managerId: dto.managerId,
          hireDate: new Date(dto.hireDate),
          baseSalary: dto.baseSalary,
          allowance: dto.allowance ?? 0,
        },
      });

      await tx.employeeMutation.create({
        data: {
          employeeId: employee.id,
          fromPositionId: null,
          toPositionId: dto.positionId ?? null,
          fromDepartmentId: null,
          toDepartmentId: dto.departmentId ?? null,
          effectiveDate: new Date(dto.hireDate),
          note: 'Initial hire',
        },
      });

      return employee;
    });
  }

  async findOne(user: AuthenticatedUser, id: string) {
    await this.assertCanView(user, id);

    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        department: true,
        position: true,
        manager: { select: { id: true, fullName: true } },
        mutations: { orderBy: { effectiveDate: 'desc' } },
      },
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }
    return employee;
  }

  async update(user: AuthenticatedUser, id: string, dto: UpdateEmployeeDto) {
    const isPrivileged = user.role === RoleName.HR_ADMIN || user.role === RoleName.SUPERADMIN;

    if (!isPrivileged) {
      if (user.employeeId !== id) {
        throw new ForbiddenException('You can only update your own data');
      }
      const existing = await this.prisma.employee.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundException('Employee not found');
      }

      const selfData: Prisma.EmployeeUpdateInput = {};
      for (const field of SELF_UPDATABLE_FIELDS) {
        if (dto[field] !== undefined) {
          (selfData as Record<string, unknown>)[field] = dto[field];
        }
      }
      return this.prisma.employee.update({ where: { id }, data: selfData });
    }

    const existing = await this.prisma.employee.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Employee not found');
    }

    const data: Prisma.EmployeeUpdateInput = {};
    if (dto.nik !== undefined) data.nik = dto.nik;
    if (dto.fullName !== undefined) data.fullName = dto.fullName;
    if (dto.address !== undefined) data.address = dto.address;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.departmentId !== undefined) {
      data.department = dto.departmentId
        ? { connect: { id: dto.departmentId } }
        : { disconnect: true };
    }
    if (dto.positionId !== undefined) {
      data.position = dto.positionId ? { connect: { id: dto.positionId } } : { disconnect: true };
    }
    if (dto.managerId !== undefined) {
      data.manager = dto.managerId ? { connect: { id: dto.managerId } } : { disconnect: true };
    }
    if (dto.hireDate !== undefined) data.hireDate = new Date(dto.hireDate);
    if (dto.baseSalary !== undefined) data.baseSalary = dto.baseSalary;
    if (dto.allowance !== undefined) data.allowance = dto.allowance;
    if (dto.status !== undefined) data.status = dto.status;

    const newDepartmentId = dto.departmentId !== undefined ? dto.departmentId : existing.departmentId;
    const newPositionId = dto.positionId !== undefined ? dto.positionId : existing.positionId;
    const positionChanged = newPositionId !== existing.positionId;
    const departmentChanged = newDepartmentId !== existing.departmentId;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.employee.update({ where: { id }, data });

      if (positionChanged || departmentChanged) {
        await tx.employeeMutation.create({
          data: {
            employeeId: id,
            fromPositionId: existing.positionId,
            toPositionId: updated.positionId,
            fromDepartmentId: existing.departmentId,
            toDepartmentId: updated.departmentId,
            effectiveDate: new Date(),
            note: dto.mutationNote ?? null,
          },
        });
      }

      return updated;
    });
  }

  async archive(id: string) {
    const employee = await this.prisma.employee.findUnique({ where: { id } });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.employee.update({
        where: { id },
        data: { status: EmployeeStatus.RESIGNED },
      });
      await tx.userAccount.updateMany({
        where: { employeeId: id },
        data: { isActive: false },
      });
      return updated;
    });
  }

  async addDocument(
    user: AuthenticatedUser,
    employeeId: string,
    docType: string | undefined,
    file: UploadedMulterFile | undefined,
  ) {
    this.assertCanManageDocuments(user, employeeId);

    const employee = await this.prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const key = `employees/${employeeId}/${Date.now()}-${file.originalname}`;
    await this.storageService.upload(key, file.buffer, file.mimetype);

    return this.prisma.employeeDocument.create({
      data: {
        employeeId,
        docType: docType ?? 'OTHER',
        fileUrl: key,
        fileName: file.originalname,
      },
    });
  }

  async listDocuments(user: AuthenticatedUser, employeeId: string) {
    await this.assertCanView(user, employeeId);
    return this.prisma.employeeDocument.findMany({
      where: { employeeId },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  private async assertCanView(user: AuthenticatedUser, employeeId: string) {
    if (user.role === RoleName.HR_ADMIN || user.role === RoleName.SUPERADMIN) {
      return;
    }
    if (user.role === RoleName.EMPLOYEE) {
      if (user.employeeId !== employeeId) {
        throw new ForbiddenException('You can only access your own data');
      }
      return;
    }
    if (user.role === RoleName.MANAGER) {
      if (user.employeeId === employeeId) {
        return;
      }
      const target = await this.prisma.employee.findUnique({
        where: { id: employeeId },
        select: { managerId: true },
      });
      if (!target || target.managerId !== user.employeeId) {
        throw new ForbiddenException('You can only access your team members');
      }
      return;
    }
    throw new ForbiddenException();
  }

  private assertCanManageDocuments(user: AuthenticatedUser, employeeId: string) {
    if (user.role === RoleName.HR_ADMIN || user.role === RoleName.SUPERADMIN) {
      return;
    }
    if (user.employeeId === employeeId) {
      return;
    }
    throw new ForbiddenException('You can only manage your own documents');
  }
}
