import { describe, expect, it, vi } from 'vitest';
import * as argon2 from 'argon2';
import { ForbiddenException } from '@nestjs/common';
import { MeService, PRIVACY_VERSION } from './me.service';
import { DonorService } from './donor.service';
import type { PrismaService } from './prisma.service';
import type { MatchingService } from './matching.service';
const actor = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  role: 'USER' as const,
  email: 'user@example.test',
  fullName: 'User',
};
describe('privacy controls', () => {
  it('blocks donor profile creation before active consent', async () => {
    const db = {
      consentRecord: { findFirst: vi.fn().mockResolvedValue(null) },
    } as unknown as PrismaService;
    await expect(
      new DonorService(db, {} as MatchingService).saveOwn(actor, {}),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
  it('records versioned consent and withdrawal stops contact sharing', async () => {
    const create = vi.fn().mockResolvedValue({ id: 'consent' });
    const updateMany = vi.fn();
    const donorUpdate = vi.fn();
    const deleteMany = vi.fn();
    const tx = {
      consentRecord: { updateMany, create },
      donorProfile: { updateMany: donorUpdate },
      requestInterest: { deleteMany },
    };
    const db = {
      consentRecord: { create },
      $transaction: (fn: (value: typeof tx) => Promise<unknown>) => fn(tx),
    } as unknown as PrismaService;
    const me = new MeService(db);
    await me.grantConsent(actor, {
      privacyVersion: PRIVACY_VERSION,
      healthProcessing: true,
      contactSharing: true,
    });
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: actor.id, privacyVersion: PRIVACY_VERSION }),
    });
    await me.withdrawConsent(actor);
    expect(donorUpdate).toHaveBeenCalledWith({
      where: { userId: actor.id },
      data: { consentToMatch: false },
    });
    expect(deleteMany).toHaveBeenCalledWith({ where: { userId: actor.id } });
  });
  it('exports owned data without password hashes or token values', async () => {
    const db = {
      user: { findUnique: vi.fn().mockResolvedValue({ id: actor.id, email: actor.email }) },
      donorProfile: { findUnique: vi.fn().mockResolvedValue(null) },
      bloodRequest: { findMany: vi.fn().mockResolvedValue([]) },
      requestInterest: { findMany: vi.fn().mockResolvedValue([]) },
      consentRecord: { findMany: vi.fn().mockResolvedValue([]) },
      session: { findMany: vi.fn().mockResolvedValue([]) },
      emailToken: { findMany: vi.fn().mockResolvedValue([]) },
      auditEvent: { findMany: vi.fn().mockResolvedValue([]) },
    } as unknown as PrismaService;
    const data = await new MeService(db).export(actor);
    expect(data.user?.id).toBe(actor.id);
    expect(JSON.stringify(data)).not.toContain('passwordHash');
    expect(db.bloodRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { ownerId: actor.id } }),
    );
    expect(db.session.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ select: expect.not.objectContaining({ tokenHash: true }) }),
    );
  });
  it('requires the password and anonymizes audit records before cascading account deletion', async () => {
    const hash = await argon2.hash('correct-password');
    const updateMany = vi.fn();
    const remove = vi.fn();
    const tx = { auditEvent: { updateMany }, user: { delete: remove } };
    const db = {
      user: { findUnique: vi.fn().mockResolvedValue({ id: actor.id, passwordHash: hash }) },
      donorProfile: { findUnique: vi.fn().mockResolvedValue({ id: 'donor-id' }) },
      $transaction: (fn: (value: typeof tx) => Promise<unknown>) => fn(tx),
    } as unknown as PrismaService;
    const me = new MeService(db);
    await expect(me.delete(actor, { password: 'wrong' })).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await me.delete(actor, { password: 'correct-password' });
    expect(updateMany).toHaveBeenCalledWith({
      where: { actorId: actor.id },
      data: { actorId: null, targetId: null, ipHash: null },
    });
    expect(updateMany).toHaveBeenCalledWith({
      where: { targetId: { in: [actor.id, 'donor-id'] } },
      data: { targetId: null },
    });
    expect(remove).toHaveBeenCalledWith({ where: { id: actor.id } });
  });
});
