import { Body, Controller, Get, Param, Patch, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { UpdateUserAccountDto } from './dto/update-user-account.dto';
import { UpsertPolicyDto } from './dto/upsert-policy.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleName } from '../../common/enums/role.enum';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @Roles(RoleName.SUPERADMIN)
  listUsers() {
    return this.adminService.listUsers();
  }

  @Patch('users/:id')
  @Roles(RoleName.SUPERADMIN)
  updateUser(@Param('id') id: string, @Body() dto: UpdateUserAccountDto) {
    return this.adminService.updateUser(id, dto);
  }

  @Get('roles')
  listRoles() {
    return this.adminService.listRoles();
  }

  @Get('policies')
  @Roles(RoleName.HR_ADMIN, RoleName.SUPERADMIN)
  listPolicies() {
    return this.adminService.listPolicies();
  }

  @Put('policies/:key')
  @Roles(RoleName.HR_ADMIN, RoleName.SUPERADMIN)
  upsertPolicy(@Param('key') key: string, @Body() dto: UpsertPolicyDto) {
    return this.adminService.upsertPolicy(key, dto);
  }
}
