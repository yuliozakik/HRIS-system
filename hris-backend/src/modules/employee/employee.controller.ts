import { Body, Controller, Get, Param, Patch, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleName } from '../../common/enums/role.enum';
import { AuthenticatedUser } from '../../common/types/auth-user';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { QueryEmployeeDto } from './dto/query-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeeService, UploadedMulterFile } from './employee.service';

@ApiTags('employees')
@ApiBearerAuth()
@Controller('employees')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Get()
  @Roles(RoleName.HR_ADMIN, RoleName.SUPERADMIN, RoleName.MANAGER)
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryEmployeeDto) {
    return this.employeeService.list(user, query);
  }

  @Post()
  @Roles(RoleName.HR_ADMIN, RoleName.SUPERADMIN)
  create(@Body() dto: CreateEmployeeDto) {
    return this.employeeService.create(dto);
  }

  @Get('directory')
  directory(@Query('search') search?: string) {
    return this.employeeService.directory(search);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.employeeService.findOne(user, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
  ) {
    return this.employeeService.update(user, id, dto);
  }

  @Patch(':id/archive')
  @Roles(RoleName.HR_ADMIN, RoleName.SUPERADMIN)
  archive(@Param('id') id: string) {
    return this.employeeService.archive(id);
  }

  @Post(':id/documents')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  uploadDocument(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body('docType') docType: string,
    @UploadedFile() file: UploadedMulterFile,
  ) {
    return this.employeeService.addDocument(user, id, docType, file);
  }

  @Get(':id/documents')
  listDocuments(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.employeeService.listDocuments(user, id);
  }
}
