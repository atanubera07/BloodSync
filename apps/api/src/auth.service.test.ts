import { describe, expect, it, vi } from 'vitest';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { PrismaService } from './prisma.service';
import type { MailService } from './mail.service';
import type { RegisterInput } from '@bloodsync/shared';

describe('AuthService security boundaries', () => {
  it('returns a created account when verification queue is unavailable so resend remains possible', async () => {
    const created = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'synthetic@example.test',
      fullName: 'Synthetic User',
      role: 'USER',
    };
    const db = {
      user: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue(created),
      },
    } as unknown as PrismaService;
    const mail = {
      enqueue: vi.fn().mockRejectedValue(new Error('Redis unavailable')),
    } as unknown as MailService;
    const auth = new AuthService(db, mail);
    await expect(
      auth.register({
        email: created.email,
        password: 'synthetic-long-password',
        fullName: created.fullName,
      }),
    ).resolves.toEqual(created);
    expect(mail.enqueue).toHaveBeenCalledWith(created.email, 'VERIFY');
  });
  it('rejects a role supplied at signup before writing a user', async () => {
    const create = vi.fn();
    const db = { user: { findUnique: vi.fn(), create } } as unknown as PrismaService;
    const auth = new AuthService(db, {} as MailService);
    await expect(
      auth.register({
        email: 'user@example.com',
        password: 'long-safe-password',
        fullName: 'Test User',
        role: 'ADMIN',
      } as RegisterInput),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(create).not.toHaveBeenCalled();
  });
  it('rejects missing or malformed access tokens', async () => {
    vi.stubEnv('DATABASE_URL', 'postgresql://example:example@localhost:5432/example');
    vi.stubEnv('WEB_ORIGIN', 'http://localhost:3000');
    vi.stubEnv('SESSION_SECRET', 'a-test-secret-with-at-least-32-characters');
    const auth = new AuthService({} as PrismaService, {} as MailService);
    await expect(auth.verifyAccess()).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(auth.verifyAccess('forged.token')).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
