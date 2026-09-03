import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';

@Injectable()
export class ShiftService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.shift.findMany({ orderBy: { name: 'asc' } });
  }

  create(dto: CreateShiftDto) {
    return this.prisma.shift.create({ data: dto });
  }

  async update(id: string, dto: UpdateShiftDto) {
    await this.ensureExists(id);
    return this.prisma.shift.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.shift.delete({ where: { id } });
    return { success: true };
  }

  private async ensureExists(id: string) {
    const existing = await this.prisma.shift.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Shift not found');
    }
  }
}
