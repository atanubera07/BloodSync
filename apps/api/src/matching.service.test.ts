import { describe, expect, it, vi } from 'vitest';
import { Prisma, type BloodRequest, type DonorProfile } from '@prisma/client';
import { MatchingService, MATCH_RADIUS_KM } from './matching.service';
import type { PrismaService } from './prisma.service';
import { PRIVACY_VERSION } from '@bloodsync/shared';

const donor = {
  id: 'donor-id',
  userId: 'user-id',
  bloodGroup: 'O-',
  birthDate: new Date('1998-03-01'),
  weightKg: new Prisma.Decimal(55),
  lastDonationAt: null,
  city: 'Kolkata',
  latitude: new Prisma.Decimal(22.5726),
  longitude: new Prisma.Decimal(88.3639),
} as DonorProfile;
const request = {
  id: 'request-id',
  ownerId: 'patient-id',
  bloodGroup: 'A+',
  city: 'Kolkata',
  latitude: new Prisma.Decimal(22.573),
  longitude: new Prisma.Decimal(88.364),
  status: 'OPEN',
  expiresAt: new Date(Date.now() + 86_400_000),
} as BloodRequest;

describe('matching boundaries', () => {
  it('rejects incompatible groups and expired or closed requests before PostGIS', async () => {
    const query = vi.fn();
    const matching = new MatchingService({ $queryRaw: query } as unknown as PrismaService);
    expect(
      await matching.isRequestNearDonor(
        { ...request, bloodGroup: 'B-' },
        { ...donor, bloodGroup: 'A+' },
      ),
    ).toBe(false);
    expect(await matching.isRequestNearDonor({ ...request, status: 'CLOSED' }, donor)).toBe(false);
    expect(await matching.isRequestNearDonor({ ...request, expiresAt: new Date(0) }, donor)).toBe(
      false,
    );
    expect(query).not.toHaveBeenCalled();
  });
  it('falls back to a case-insensitive city match when either coordinate is absent', async () => {
    const matching = new MatchingService({ $queryRaw: vi.fn() } as unknown as PrismaService);
    expect(
      await matching.isRequestNearDonor({ ...request, latitude: null, city: ' KOLKATA ' }, donor),
    ).toBe(true);
    expect(
      await matching.isRequestNearDonor({ ...request, longitude: null, city: 'Delhi' }, donor),
    ).toBe(false);
  });
  it('uses the PostGIS result at the radius boundary', async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce([{ nearby: true }])
      .mockResolvedValueOnce([{ nearby: false }]);
    const matching = new MatchingService({ $queryRaw: query } as unknown as PrismaService);
    expect(await matching.isRequestNearDonor(request, donor)).toBe(true);
    expect(await matching.isRequestNearDonor(request, donor)).toBe(false);
    const sql = query.mock.calls[0][0] as Prisma.Sql;
    expect(sql.values).toContain(MATCH_RADIUS_KM * 1000);
  });
  it('filters donor results by screening and queries active consent and compatibility', async () => {
    const query = vi.fn().mockResolvedValue([
      {
        id: 'eligible',
        bloodGroup: 'O-',
        city: 'Kolkata',
        birthDate: new Date('1998-03-01'),
        weightKg: new Prisma.Decimal(55),
        lastDonationAt: null,
        distanceKm: 2,
      },
      {
        id: 'underweight',
        bloodGroup: 'O-',
        city: 'Kolkata',
        birthDate: new Date('1998-03-01'),
        weightKg: new Prisma.Decimal(30),
        lastDonationAt: null,
        distanceKm: 3,
      },
    ]);
    const matching = new MatchingService({ $queryRaw: query } as unknown as PrismaService);
    expect(await matching.donorsForRequest(request)).toEqual([
      { id: 'eligible', bloodGroup: 'O-', city: 'Kolkata', distanceKm: 2 },
    ]);
    const sql = query.mock.calls[0][0] as Prisma.Sql;
    expect(sql.sql).toContain('"withdrawnAt" IS NULL');
    expect(sql.sql).toContain('"consentToMatch" = true');
    expect(sql.values).toContain(PRIVACY_VERSION);
    expect(sql.values).toContain('O-');
  });
  it('queries only open, unexpired requests for a donor', async () => {
    const query = vi.fn().mockResolvedValue([]);
    const matching = new MatchingService({ $queryRaw: query } as unknown as PrismaService);
    await matching.requestsForDonor(donor);
    const sql = query.mock.calls[0][0] as Prisma.Sql;
    expect(sql.sql).toContain('"status" = \'OPEN\'');
    expect(sql.sql).toContain('"expiresAt" > NOW()');
  });
});
