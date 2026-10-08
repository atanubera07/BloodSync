import { Body, Controller, Get, HttpCode, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { DonorService } from './donor.service';
import type { AuthRequest } from './actor';
@Controller('donors/me')
@UseGuards(AuthGuard)
export class DonorController {
  constructor(private readonly donors: DonorService) {}
  @Get() getOwn(@Req() req: AuthRequest) {
    return this.donors.getOwn(req.user);
  }
  @Put() saveOwn(@Req() req: AuthRequest, @Body() body: unknown) {
    return this.donors.saveOwn(req.user, body);
  }
  @Get('matches') matches(@Req() req: AuthRequest) {
    return this.donors.matches(req.user);
  }
  @Post('interests/:requestId') @HttpCode(200) interest(
    @Req() req: AuthRequest,
    @Param('requestId') requestId: string,
  ) {
    return this.donors.expressInterest(req.user, requestId);
  }
}
