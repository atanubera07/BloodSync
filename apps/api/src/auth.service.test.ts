import { describe, expect, it, vi } from 'vitest';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { PrismaService } from './prisma.service';
import type { MailService } from './mail.service';
import type { RegisterInput } from '@bloodsync/shared';
import type { RegistrationBloom } from './registration-bloom';

describe('AuthService security boundaries', () => {
  const signup = {
    email: 'synthetic@example.test',
    password: 'synthetic-long-password',
    fullName: 'Synthetic User',
    acceptTerms: true as const,
  };

  it('uses a Bloom miss to skip a duplicate lookup while keeping the unique index authoritative', async () => {
    const created = { id: 'synthetic-id', email: signup.email };
    const findUnique = vi.fn();
    const create = vi.fn().mockResolvedValue(created);
    const bloom = {
      mightContain: vi.fn().mockResolvedValue(false),
      add: vi.fn().mockResolvedValue(undefined),
    } as unknown as RegistrationBloom;
    const auth = new AuthService(
      { user: { findUnique, create } } as unknown as PrismaService,
      { enqueue: vi.fn() } as unknown as MailService,
      undefined,
      bloom,
    );

    await expect(auth.register(signup)).resolves.toEqual(created);
    expect(findUnique).not.toHaveBeenCalled();
    expect(bloom.add).toHaveBeenCalledWith(signup.email);

    create.mockRejectedValueOnce({ code: 'P2002' });
    await expect(auth.register(signup)).rejects.toThrow(
      'Unable to create account with these details',
    );
  });

  it('checks PostgreSQL on a Bloom hit and if Redis fails', async () => {
    const findUnique = vi
      .fn()
      .mockResolvedValueOnce({ id: 'existing' })
      .mockResolvedValueOnce(null);
    const create = vi.fn().mockResolvedValue({ id: 'new', email: signup.email });
    const bloom = {
      mightContain: vi
        .fn()
        .mockResolvedValueOnce(true)
        .mockRejectedValueOnce(new Error('Redis unavailable')),
      add: vi.fn().mockRejectedValue(new Error('Redis unavailable')),
    } as unknown as RegistrationBloom;
    const auth = new AuthService(
      { user: { findUnique, create } } as unknown as PrismaService,
      { enqueue: vi.fn() } as unknown as MailService,
      undefined,
      bloom,
    );

    await expect(auth.register(signup)).rejects.toThrow(
      'Unable to create account with these details',
    );
    expect(create).not.toHaveBeenCalled();
    await expect(auth.register(signup)).resolves.toMatchObject({ id: 'new' });
    expect(findUnique).toHaveBeenCalledTimes(2);
  });

  it('stores optional signup details and rejects missing terms consent', async () => {
    const create = vi
      .fn()
      .mockResolvedValue({ id: 'synthetic-id', email: 'synthetic@example.test' });
    const db = {
      user: { findUnique: vi.fn().mockResolvedValue(null), create },
    } as unknown as PrismaService;
    const auth = new AuthService(db, { enqueue: vi.fn() } as unknown as MailService);
    const details = {
      email: 'synthetic@example.test',
      password: 'synthetic-long-password',
      fullName: 'Synthetic User',
      phoneNumber: '+1 555 010 0000',
      declaredBloodGroup: 'O+' as const,
      postalAddress: '123 Example Street',
      city: 'Example City',
      stateRegion: 'Example State',
    };
    await expect(auth.register(details as RegisterInput)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(create).not.toHaveBeenCalled();
    await auth.register({ ...details, acceptTerms: true });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          phoneNumber: details.phoneNumber,
          declaredBloodGroup: details.declaredBloodGroup,
          postalAddress: details.postalAddress,
          city: details.city,
          stateRegion: details.stateRegion,
          termsAcceptedAt: expect.any(Date),
        }),
      }),
    );
  });
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
        acceptTerms: true,
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
        acceptTerms: true,
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
