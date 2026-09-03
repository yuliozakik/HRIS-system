import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LeaveStatus } from '@prisma/client';
import { LeaveService } from './leave.service';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { DecideLeaveRequestDto } from './dto/decide-leave-request.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/auth-user';

@ApiTags('leave')
@Controller()
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  @Post('leave-requests')
  createLeaveRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateLeaveRequestDto,
  ) {
    return this.leaveService.createLeaveRequest(user, dto);
  }

  @Get('leave-requests')
  findLeaveRequests(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: LeaveStatus,
    @Query('scope') scope?: string,
  ) {
    return this.leaveService.findLeaveRequests(user, status, scope);
  }

  @Patch('leave-requests/:id')
  decideLeaveRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: DecideLeaveRequestDto,
  ) {
    return this.leaveService.decideLeaveRequest(user, id, dto);
  }

  @Patch('leave-requests/:id/cancel')
  cancelLeaveRequest(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.leaveService.cancelLeaveRequest(user, id);
  }

  @Get('leave-balances/:employeeId')
  getLeaveBalances(
    @CurrentUser() user: AuthenticatedUser,
    @Param('employeeId') employeeId: string,
    @Query('year') year?: string,
  ) {
    return this.leaveService.getLeaveBalances(
      user,
      employeeId,
      year ? Number(year) : undefined,
    );
  }
}
