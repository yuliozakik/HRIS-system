import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleName } from '../../common/enums/role.enum';
import { AuthenticatedUser } from '../../common/types/auth-user';
import { AttendanceService } from './attendance.service';
import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';
import { QueryAttendanceDto } from './dto/query-attendance.dto';

@ApiTags('attendance')
@ApiBearerAuth()
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('check-in')
  checkIn(@CurrentUser() user: AuthenticatedUser, @Body() dto: CheckInDto) {
    return this.attendanceService.checkIn(user, dto);
  }

  @Post('check-out')
  checkOut(@CurrentUser() user: AuthenticatedUser, @Body() dto: CheckOutDto) {
    return this.attendanceService.checkOut(user, dto);
  }

  @Get('me')
  findMine(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryAttendanceDto) {
    return this.attendanceService.findMine(user, query);
  }

  @Get('team')
  @Roles(RoleName.MANAGER, RoleName.HR_ADMIN, RoleName.SUPERADMIN)
  findTeam(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryAttendanceDto) {
    return this.attendanceService.findTeam(user, query);
  }
}
