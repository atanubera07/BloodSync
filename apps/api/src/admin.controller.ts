import { Controller, Get, HttpCode, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AdminGuard } from './auth.guard';
import { AdminService } from './admin.service';
import type { AuthRequest } from './actor';
@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}
  @Get('donors') donors(@Req() req: AuthRequest) {
    return this.admin.pendingDonors(req.user);
  }
  @Post('donors/:id/approve') @HttpCode(200) approve(
    @Req() req: AuthRequest,
    @Param('id') id: string,
  ) {
    return this.admin.reviewDonor(req.user, id, 'APPROVED');
  }
  @Post('donors/:id/reject') @HttpCode(200) reject(
    @Req() req: AuthRequest,
    @Param('id') id: string,
  ) {
    return this.admin.reviewDonor(req.user, id, 'REJECTED');
  }
  @Get('audit') audit(@Req() req: AuthRequest) {
    return this.admin.audit(req.user);
  }
}
