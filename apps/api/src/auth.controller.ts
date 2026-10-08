import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { ConfigService } from './config';
import { randomBytes } from 'node:crypto';
import { Public } from './public';
import {
  registerSchema,
  loginSchema,
  emailInputSchema,
  tokenInputSchema,
  resetPasswordSchema,
} from '@bloodsync/shared';
import type { z } from 'zod';
import { ZodBodyPipe } from './zod-body.pipe';
const cookieBase = (secure: boolean) => ({
  httpOnly: true,
  secure,
  sameSite: 'strict' as const,
  path: '/',
});
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}
  private cookieBase() {
    return cookieBase(this.config.values.NODE_ENV === 'production');
  }
  @Public() @Post('register') register(
    @Body(new ZodBodyPipe(registerSchema)) body: z.infer<typeof registerSchema>,
  ) {
    return this.auth.register(body);
  }
  @Public() @Post('verify-email/request') @HttpCode(200) requestVerification(
    @Body(new ZodBodyPipe(emailInputSchema)) body: z.infer<typeof emailInputSchema>,
  ) {
    return this.auth.requestVerification(body);
  }
  @Public() @Post('verify-email') @HttpCode(200) verifyEmail(
    @Body(new ZodBodyPipe(tokenInputSchema)) body: z.infer<typeof tokenInputSchema>,
  ) {
    return this.auth.verifyEmail(body);
  }
  @Public() @Post('password/forgot') @HttpCode(200) forgotPassword(
    @Body(new ZodBodyPipe(emailInputSchema)) body: z.infer<typeof emailInputSchema>,
  ) {
    return this.auth.requestPasswordReset(body);
  }
  @Public() @Post('password/reset') @HttpCode(200) resetPassword(
    @Body(new ZodBodyPipe(resetPasswordSchema)) body: z.infer<typeof resetPasswordSchema>,
  ) {
    return this.auth.resetPassword(body);
  }
  @Public() @Post('login') @HttpCode(200) async login(
    @Body(new ZodBodyPipe(loginSchema)) body: z.infer<typeof loginSchema>,
    @Req() req: Request & { user?: unknown },
    @Res() res: Response,
  ) {
    const tokens = await this.auth.login(body);
    req.user = await this.auth.verifyAccess(tokens.access);
    res.cookie('bs_csrf', randomBytes(32).toString('base64url'), {
      ...this.cookieBase(),
      httpOnly: false,
      maxAge: 7 * 24 * 60 * 60_000,
    });
    res.cookie('bs_access', tokens.access, { ...this.cookieBase(), maxAge: 15 * 60_000 });
    res.cookie('bs_refresh', tokens.refresh, {
      ...this.cookieBase(),
      path: '/',
      maxAge: 7 * 24 * 60 * 60_000,
    });
    return res.json({ ok: true });
  }
  @Public() @Post('refresh') @HttpCode(200) async refresh(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const tokens = await this.auth.refresh(req.cookies?.bs_refresh);
    res.cookie('bs_csrf', randomBytes(32).toString('base64url'), {
      ...this.cookieBase(),
      httpOnly: false,
      maxAge: 7 * 24 * 60 * 60_000,
    });
    res.cookie('bs_access', tokens.access, { ...this.cookieBase(), maxAge: 15 * 60_000 });
    res.cookie('bs_refresh', tokens.refresh, {
      ...this.cookieBase(),
      path: '/',
      maxAge: 7 * 24 * 60 * 60_000,
    });
    return res.json({ ok: true });
  }
  @Public() @Post('logout') @HttpCode(200) async logout(@Req() req: Request, @Res() res: Response) {
    await this.auth.logout(req.cookies?.bs_refresh);
    res.clearCookie('bs_csrf', { ...this.cookieBase(), httpOnly: false });
    res.clearCookie('bs_access', this.cookieBase());
    res.clearCookie('bs_refresh', { ...this.cookieBase(), path: '/' });
    return res.json({ ok: true });
  }
  @Get('me') @UseGuards(AuthGuard) me(@Req() req: Request & { user: unknown }) {
    return req.user;
  }
}
