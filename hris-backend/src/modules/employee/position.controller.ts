import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleName } from '../../common/enums/role.enum';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { PositionService } from './position.service';

@ApiTags('positions')
@ApiBearerAuth()
@Controller('positions')
export class PositionController {
  constructor(private readonly positionService: PositionService) {}

  @Get()
  list(@Query('departmentId') departmentId?: string) {
    return this.positionService.list(departmentId);
  }

  @Post()
  @Roles(RoleName.HR_ADMIN, RoleName.SUPERADMIN)
  create(@Body() dto: CreatePositionDto) {
    return this.positionService.create(dto);
  }

  @Patch(':id')
  @Roles(RoleName.HR_ADMIN, RoleName.SUPERADMIN)
  update(@Param('id') id: string, @Body() dto: UpdatePositionDto) {
    return this.positionService.update(id, dto);
  }
}
