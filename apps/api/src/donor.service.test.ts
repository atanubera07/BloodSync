import { describe, expect, it, vi } from 'vitest';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { DonorService } from './donor.service';
import type { PrismaService } from './prisma.service';
import type { MatchingService } from './matching.service';

const actor = {
  id: 'user-id',
  role: 'USER' as const,
  email: 'synthetic@example.test',
  fullName: 'Synthetic',
};
const donor = { id: 'donor-id', userId: actor.id, status: 'APPROVED', consentToMatch: true };

describe('DonorService ownership and approval', () => {
  it('loads only the current user profile', async () => {
    const findUnique = vi.fn().mockResolvedValue(null);
    const service = new DonorService(
      { donorProfile: { findUnique } } as unknown as PrismaService,
      {} as MatchingService,
    );
    await expect(service.getOwn(actor)).rejects.toBeInstanceOf(NotFoundException);
    expect(findUnique).toHaveBeenCalledWith({ where: { userId: actor.id } });
  });
  it('blocks matching until an approved donor has current contact consent', async () => {
    const db = {
      donorProfile: { findUnique: vi.fn().mockResolvedValue(donor) },
      consentRecord: { findFirst: vi.fn().mockResolvedValue(null) },
    } as unknown as PrismaService;
    const matches = vi.fn();
    const service = new DonorService(db, {
      requestsForDonor: matches,
    } as unknown as MatchingService);
    await expect(service.matches(actor)).rejects.toBeInstanceOf(ForbiddenException);
    expect(matches).not.toHaveBeenCalled();
  });
  it('does not create an interest for a closed request or the owner', async () => {
    const request = {
      id: 'request-id',
      status: 'CLOSED',
      expiresAt: new Date(Date.now() + 86_400_000),
      ownerId: 'patient-id',
    };
    const upsert = vi.fn();
    const db = {
      donorProfile: { findUnique: vi.fn().mockResolvedValue(donor) },
      consentRecord: { findFirst: vi.fn().mockResolvedValue({}) },
      bloodRequest: { findUnique: vi.fn().mockResolvedValue(request) },
      requestInterest: { upsert },
    } as unknown as PrismaService;
    const service = new DonorService(db, {} as MatchingService);
    await expect(
      service.expressInterest(actor, '550e8400-e29b-41d4-a716-446655440000'),
    ).rejects.toBeInstanceOf(NotFoundException);
    request.status = 'OPEN';
    request.ownerId = actor.id;
    await expect(
      service.expressInterest(actor, '550e8400-e29b-41d4-a716-446655440000'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(upsert).not.toHaveBeenCalled();
  });
});
