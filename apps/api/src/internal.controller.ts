import { Controller, ForbiddenException, Get, Post, Body, Req } from '@nestjs/common';
import { createHash, timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';
import { z } from 'zod';
import { ConfigService } from './config';
import { MailService } from './mail.service';
import { RequestExpiryService } from './request-expiry.service';
import { Public } from './public';
import { ZodBodyPipe } from './zod-body.pipe';

const jobSchema = z.strictObject({ email: z.email().max(254), kind: z.enum(['VERIFY', 'RESET']) });

function requireSecret(actual: string | undefined, expected: string | undefined) {
  if (!actual || !expected) throw new ForbiddenException();
  const actualHash = createHash('sha256').update(actual).digest();
  const expectedHash = createHash('sha256').update(expected).digest();
  if (!timingSafeEqual(actualHash, expectedHash)) throw new ForbiddenException();
}

@Controller('internal')
export class InternalController {
  constructor(
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  @Public() @Post('account-email') async accountEmail(
    @Req() req: Request,
    @Body(new ZodBodyPipe(jobSchema)) body: z.infer<typeof jobSchema>,
  ) {
    requireSecret(req.header('x-internal-job-secret'), this.config.values.INTERNAL_JOB_SECRET);
    await this.mail.process(body.email, body.kind);
    return { ok: true };
  }
}

@Controller('cron')
export class CronController {
  constructor(
    private readonly expiry: RequestExpiryService,
    private readonly config: ConfigService,
  ) {}

  @Public() @Get('expire-requests') async expire(@Req() req: Request) {
    requireSecret(
      req.header('authorization')?.replace(/^Bearer /, ''),
      this.config.values.CRON_SECRET,
    );
    const result = await this.expiry.expire();
    return { expired: result.count };
  }
}
