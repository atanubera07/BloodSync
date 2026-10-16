import { describe, expect, it, vi } from 'vitest';
import type { Request } from 'express';
import { ConfigService } from './config';
import { CronController, InternalController } from './internal.controller';
import { MailService } from './mail.service';
import { RequestExpiryService } from './request-expiry.service';

const secret = 'synthetic-job-secret-longer-than-32-characters';
const config = {
  values: { INTERNAL_JOB_SECRET: secret, CRON_SECRET: secret },
} as ConfigService;
const request = (value?: string, header = 'x-internal-job-secret') =>
  ({ header: (name: string) => (name === header ? value : undefined) }) as Request;

describe('Vercel internal routes', () => {
  it('rejects unsigned mail jobs before looking up an account', async () => {
    const mail = { process: vi.fn() } as unknown as MailService;
    const controller = new InternalController(mail, config);
    const body = { email: 'synthetic@example.test', kind: 'VERIFY' as const };
    await expect(controller.accountEmail(request(), body)).rejects.toThrow();
    await expect(controller.accountEmail(request('wrong'), body)).rejects.toThrow();
    expect(mail.process).not.toHaveBeenCalled();
    await expect(controller.accountEmail(request(secret), body)).resolves.toEqual({ ok: true });
    expect(mail.process).toHaveBeenCalledWith(body.email, body.kind);
  });

  it('rejects unsigned expiry invocations', async () => {
    const expiry = {
      expire: vi.fn().mockResolvedValue({ count: 2 }),
    } as unknown as RequestExpiryService;
    const controller = new CronController(expiry, config);
    await expect(controller.expire(request(undefined, 'authorization'))).rejects.toThrow();
    expect(expiry.expire).not.toHaveBeenCalled();
    await expect(controller.expire(request(`Bearer ${secret}`, 'authorization'))).resolves.toEqual({
      expired: 2,
    });
  });
});
