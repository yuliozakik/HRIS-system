import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { ReimbursementStatus } from '@prisma/client';
import { ReimbursementService, UploadedMulterFile } from './reimbursement.service';
import { CreateReimbursementDto } from './dto/create-reimbursement.dto';
import { DecideReimbursementDto } from './dto/decide-reimbursement.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/auth-user';

@ApiTags('reimbursements')
@ApiBearerAuth()
@Controller('reimbursements')
export class ReimbursementController {
  constructor(private readonly reimbursementService: ReimbursementService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('receipt'))
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateReimbursementDto,
    @UploadedFile() receipt: UploadedMulterFile | undefined,
  ) {
    return this.reimbursementService.create(user, dto, receipt);
  }

  @Get()
  findMany(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: ReimbursementStatus,
    @Query('scope') scope?: string,
  ) {
    return this.reimbursementService.findMany(user, status, scope);
  }

  @Patch(':id')
  decide(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: DecideReimbursementDto,
  ) {
    return this.reimbursementService.decide(user, id, dto);
  }

  @Patch(':id/cancel')
  cancel(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.reimbursementService.cancel(user, id);
  }

  @Get(':id/receipt')
  async downloadReceipt(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Res({ passthrough: false }) res: Response,
  ): Promise<void> {
    const { buffer, filename } = await this.reimbursementService.getReceipt(user, id);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }
}
