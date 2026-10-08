import { describe, expect, it, vi } from 'vitest';
import {
  ConflictException,
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import type { PrismaService } from './prisma.service';

const admin = {
  id: 'admin-id',
  role: 'ADMIN' as const,
  email: 'admin@example.test',
  fullName: 'Admin',
};
const user = { ...admin, role: 'USER' as const };
const id = '550e8400-e29b-41d4-a716-446655440000';
const profile = {
  id,
  userId: 'donor-id',
  status: 'PENDING',
  updatedAt: new Date(),
  birthDate: new Date('1998-03-01'),
  weightKg: 55,
  lastDonationAt: null,
};

describe('AdminService review policy', () => {
  it('rejects non-admin list and review before querying donor data', async () => {
    const findMany = vi.fn();
    const findUnique = vi.fn();
    const service = new AdminService({
      donorProfile: { findMany, findUnique },
    } as unknown as PrismaService);
    await expect(service.pendingDonors(user)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.reviewDonor(user, id, 'APPROVED')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(findMany).not.toHaveBeenCalled();
    expect(findUnique).not.toHaveBeenCalled();
  });
  it('rejects self-review and an already reviewed donor', async () => {
    const findUnique = vi
      .fn()
      .mockResolvedValueOnce({ ...profile, userId: admin.id })
      .mockResolvedValueOnce({ ...profile, status: 'APPROVED' });
    const service = new AdminService({ donorProfile: { findUnique } } as unknown as PrismaService);
    await expect(service.reviewDonor(admin, id, 'APPROVED')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(service.reviewDonor(admin, id, 'APPROVED')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
  it('blocks approval when screening fails and prevents a stale write', async () => {
    const db = {
      donorProfile: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce({ ...profile, weightKg: 30 })
          .mockResolvedValueOnce(profile),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
      auditEvent: { create: vi.fn() },
    } as unknown as PrismaService;
    (
      db as unknown as {
        $transaction: (fn: (tx: PrismaService) => Promise<unknown>) => Promise<unknown>;
      }
    ).$transaction = (fn) => fn(db);
    const service = new AdminService(db);
    await expect(service.reviewDonor(admin, id, 'APPROVED')).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
    await expect(service.reviewDonor(admin, id, 'APPROVED')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(db.auditEvent.create).not.toHaveBeenCalled();
  });
  it('records a successful approval only after the conditional update', async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    const create = vi.fn();
    const db = {
      donorProfile: { findUnique: vi.fn().mockResolvedValue(profile), updateMany },
      auditEvent: { create },
    } as unknown as PrismaService;
    (
      db as unknown as {
        $transaction: (fn: (tx: PrismaService) => Promise<unknown>) => Promise<unknown>;
      }
    ).$transaction = (fn) => fn(db);
    const service = new AdminService(db);
    await expect(service.reviewDonor(admin, id, 'APPROVED')).resolves.toEqual({
      ok: true,
      status: 'APPROVED',
    });
    expect(updateMany).toHaveBeenCalledWith({
      where: { id, status: 'PENDING', updatedAt: profile.updatedAt },
      data: { status: 'APPROVED' },
    });
    expect(create).toHaveBeenCalledWith({
      data: { actorId: admin.id, targetId: id, action: 'DONOR_APPROVED' },
    });
  });
});
