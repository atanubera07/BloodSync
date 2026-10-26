import { describe, expect, it, vi } from 'vitest';
import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of, throwError } from 'rxjs';
import { AuditInterceptor } from './audit.interceptor';
import type { PrismaService } from './prisma.service';
import type { ConfigService } from './config';

function fixture(path: string, method = 'POST') {
  const create = vi.fn().mockResolvedValue({});
  const interceptor = new AuditInterceptor(
    { auditEvent: { create } } as unknown as PrismaService,
    { values: { SESSION_SECRET: 'synthetic-audit-secret-at-least-32-characters' } } as ConfigService,
  );
  const context = {
    switchToHttp: () => ({
      getRequest: () => ({
        method,
        path,
        ip: '192.0.2.1',
        socket: {},
        user: { id: 'synthetic-user' },
      }),
    }),
  } as unknown as ExecutionContext;
  return { create, interceptor, context };
}

describe('audit events', () => {
  it.each(['/v1', '/api/v1'])('records login events under the %s prefix', async (prefix) => {
    const { create, interceptor, context } = fixture(`${prefix}/auth/login`);
    await lastValueFrom(interceptor.intercept(context, { handle: () => of({ ok: true }) }));
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'LOGIN', result: 'SUCCESS', actorId: 'synthetic-user' }),
    });
  });

  it('records failed logins under the Vercel prefix', async () => {
    const { create, interceptor, context } = fixture('/api/v1/auth/login');
    await expect(
      lastValueFrom(
        interceptor.intercept(context, { handle: () => throwError(() => new UnauthorizedException()) }),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'LOGIN_FAILED', result: 'FAILURE' }),
    });
  });

  it('does not record a consent read as a grant', async () => {
    const { create, interceptor, context } = fixture('/api/v1/me/consent', 'GET');
    await lastValueFrom(interceptor.intercept(context, { handle: () => of(null) }));
    expect(create).not.toHaveBeenCalled();
  });

  it.each([
    ['POST', 'CONSENT_GRANTED'],
    ['DELETE', 'CONSENT_WITHDRAWN'],
  ])('records the %s consent mutation', async (method, action) => {
    const { create, interceptor, context } = fixture('/api/v1/me/consent', method);
    await lastValueFrom(interceptor.intercept(context, { handle: () => of({ ok: true }) }));
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action, result: 'SUCCESS' }),
    });
  });
});
