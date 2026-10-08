import { describe, expect, it, vi } from 'vitest';
import { hashPassword } from './password';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService, hashToken, MAX_FAILED_LOGINS } from './auth.service';
import type { PrismaService } from './prisma.service';
import type { MailService } from './mail.service';

vi.stubEnv('DATABASE_URL', 'postgresql://example:example@localhost:5432/example');
vi.stubEnv('WEB_ORIGIN', 'http://localhost:3000');
vi.stubEnv('SESSION_SECRET', 'test-secret-longer-than-thirty-two-characters');

describe('refresh rotation', () => {
  it('revokes the old token and rejects its reuse', async () => {
    const sessions = new Map<
      string,
      { id: string; userId: string; tokenHash: string; expiresAt: Date; revokedAt: Date | null }
    >();
    const db = {
      session: {
        create: vi.fn(
          async ({ data }: { data: { userId: string; tokenHash: string; expiresAt: Date } }) => {
            const session = { ...data, id: String(sessions.size + 1), revokedAt: null };
            sessions.set(data.tokenHash, session);
            return session;
          },
        ),
        findUnique: vi.fn(
          async ({ where }: { where: { tokenHash: string } }) =>
            sessions.get(where.tokenHash) ?? null,
        ),
        updateMany: vi.fn(async ({ where }: { where: { id: string; revokedAt: null } }) => {
          const session = [...sessions.values()].find(
            (item) => item.id === where.id && item.revokedAt === null,
          );
          if (!session) return { count: 0 };
          session.revokedAt = new Date();
          return { count: 1 };
        }),
      },
    } as unknown as PrismaService;
    (
      db as unknown as {
        $transaction: (fn: (tx: PrismaService) => Promise<unknown>) => Promise<unknown>;
      }
    ).$transaction = (fn) => fn(db);
    const auth = new AuthService(db, {} as MailService);
    const first = await auth.issueSession('user-id');
    const second = await auth.refresh(first.refresh);
    expect(first.refresh).not.toBe(second.refresh);
    expect(sessions.get(hashToken(first.refresh))?.revokedAt).toBeInstanceOf(Date);
    await expect(auth.refresh(first.refresh)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(sessions.get(hashToken(second.refresh))?.revokedAt).toBeNull();
  });
});

describe('account lockout', () => {
  it('locks after repeated bad passwords and blocks the correct password until expiry', async () => {
    const passwordHash = await hashPassword('correct-long-password');
    const user = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'donor@example.test',
      passwordHash,
      emailVerifiedAt: new Date(),
      failedLoginAttempts: 0,
      lockedUntil: null as Date | null,
    };
    const db = {
      user: { findUnique: vi.fn(async () => ({ ...user })), update: vi.fn() },
      $executeRaw: vi.fn(async () => {
        user.failedLoginAttempts++;
        if (user.failedLoginAttempts >= MAX_FAILED_LOGINS)
          user.lockedUntil = new Date(Date.now() + 15 * 60_000);
        return 1;
      }),
    } as unknown as PrismaService;
    const auth = new AuthService(db, {} as MailService);
    for (let i = 0; i < MAX_FAILED_LOGINS; i++)
      await expect(
        auth.login({ email: user.email, password: 'wrong-password' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(user.lockedUntil).toBeInstanceOf(Date);
    await expect(
      auth.login({ email: user.email, password: 'correct-long-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(
      (db as unknown as { $executeRaw: ReturnType<typeof vi.fn> }).$executeRaw,
    ).toHaveBeenCalledTimes(MAX_FAILED_LOGINS);
  });
});
