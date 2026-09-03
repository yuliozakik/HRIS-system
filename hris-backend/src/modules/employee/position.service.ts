import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';

@Injectable()
export class PositionService {
  constructor(private readonly prisma: PrismaService) {}

  list(departmentId?: string) {
    return this.prisma.position.findMany({
      where: departmentId ? { departmentId } : undefined,
      orderBy: { title: 'asc' },
    });
  }

  create(dto: CreatePositionDto) {
    return this.prisma.position.create({ data: dto });
  }

  async update(id: string, dto: UpdatePositionDto) {
    const existing = await this.prisma.position.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Position not found');
    }
    return this.prisma.position.update({ where: { id }, data: dto });
  }
}
