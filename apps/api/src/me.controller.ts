import { Body, Controller, Delete, Get, HttpCode, Post, Req } from '@nestjs/common';
import type { AuthRequest } from './actor';
import { MeService } from './me.service';
import { consentSchema, deleteAccountSchema } from '@bloodsync/shared';
import type { z } from 'zod';
import { ZodBodyPipe } from './zod-body.pipe';
@Controller('me')
export class MeController {
  constructor(private readonly me: MeService) {}
  @Get('consent') consent(@Req() req: AuthRequest) {
    return this.me.consent(req.user);
  }
  @Post('consent') @HttpCode(200) grant(
    @Req() req: AuthRequest,
    @Body(new ZodBodyPipe(consentSchema)) body: z.infer<typeof consentSchema>,
  ) {
    return this.me.grantConsent(req.user, body);
  }
  @Delete('consent') @HttpCode(200) withdraw(@Req() req: AuthRequest) {
    return this.me.withdrawConsent(req.user);
  }
  @Get('export') export(@Req() req: AuthRequest) {
    return this.me.export(req.user);
  }
  @Delete() @HttpCode(200) delete(
    @Req() req: AuthRequest,
    @Body(new ZodBodyPipe(deleteAccountSchema)) body: z.infer<typeof deleteAccountSchema>,
  ) {
    return this.me.delete(req.user, body);
  }
}
