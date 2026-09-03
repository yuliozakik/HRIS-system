import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserAccountDto } from './dto/update-user-account.dto';
import { UpsertPolicyDto } from './dto/upsert-policy.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers() {
    const users = await this.prisma.userAccount.findMany({
      include: {
        role: { select: { id: true, name: true } },
        employee: { select: { id: true, fullName: true } },
      },
      orderBy: { email: 'asc' },
    });

    return users.map((u) => ({
      id: u.id,
      email: u.email,
      isActive: u.isActive,
      roleId: u.roleId,
      roleName: u.role.name,
      employeeId: u.employeeId,
      employeeFullName: u.employee?.fullName ?? null,
      createdAt: u.createdAt,
    }));
  }

  async updateUser(id: string, dto: UpdateUserAccountDto) {
    const user = await this.prisma.userAccount.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan');
    }

    if (dto.roleId) {
      const role = await this.prisma.role.findUnique({ where: { id: dto.roleId } });
      if (!role) {
        throw new BadRequestException('Role tidak valid');
      }
    }

    return this.prisma.userAccount.update({
      where: { id },
      data: {
        ...(dto.roleId !== undefined ? { roleId: dto.roleId } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
      include: { role: { select: { id: true, name: true } } },
    });
  }

  async listRoles() {
    return this.prisma.role.findMany({ orderBy: { name: 'asc' } });
  }

  async listPolicies() {
    const rows = await this.prisma.policySetting.findMany();
    return rows.reduce<Record<string, unknown>>((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {});
  }

  async upsertPolicy(key: string, dto: UpsertPolicyDto) {
    return this.prisma.policySetting.upsert({
      where: { key },
      create: { key, value: dto.value },
      update: { value: dto.value },
    });
  }
}
