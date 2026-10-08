import { Body, Controller, Delete, Get, HttpCode, Post, Req } from '@nestjs/common';
import type { AuthRequest } from './actor';
import { MeService } from './me.service';
@Controller('me')
export class MeController {
  constructor(private readonly me: MeService) {}
  @Get('consent') consent(@Req() req: AuthRequest) {
    return this.me.consent(req.user);
  }
  @Post('consent') @HttpCode(200) grant(@Req() req: AuthRequest, @Body() body: unknown) {
    return this.me.grantConsent(req.user, body);
  }
  @Delete('consent') @HttpCode(200) withdraw(@Req() req: AuthRequest) {
    return this.me.withdrawConsent(req.user);
  }
  @Get('export') export(@Req() req: AuthRequest) {
    return this.me.export(req.user);
  }
  @Delete() @HttpCode(200) delete(@Req() req: AuthRequest, @Body() body: unknown) {
    return this.me.delete(req.user, body);
  }
}
