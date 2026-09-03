import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleName } from '../../common/enums/role.enum';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { ShiftService } from './shift.service';

@ApiTags('shifts')
@ApiBearerAuth()
@Controller('shifts')
export class ShiftController {
  constructor(private readonly shiftService: ShiftService) {}

  @Get()
  list() {
    return this.shiftService.list();
  }

  @Post()
  @Roles(RoleName.HR_ADMIN, RoleName.SUPERADMIN)
  create(@Body() dto: CreateShiftDto) {
    return this.shiftService.create(dto);
  }

  @Patch(':id')
  @Roles(RoleName.HR_ADMIN, RoleName.SUPERADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateShiftDto) {
    return this.shiftService.update(id, dto);
  }

  @Delete(':id')
  @Roles(RoleName.HR_ADMIN, RoleName.SUPERADMIN)
  remove(@Param('id') id: string) {
    return this.shiftService.remove(id);
  }
}
