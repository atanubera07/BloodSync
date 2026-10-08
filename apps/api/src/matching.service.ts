import { Injectable } from '@nestjs/common';
import { Prisma, type BloodRequest, type DonorProfile } from '@prisma/client';
import {
  assessDonorEligibility,
  compatibleDonorGroups,
  compatibleRecipientGroups,
  type BloodGroup,
} from '@bloodsync/shared';
import { PrismaService } from './prisma.service';

export const MATCH_RADIUS_KM = 50;
type DonorRow = {
  id: string;
  bloodGroup: string;
  city: string;
  birthDate: Date;
  weightKg: Prisma.Decimal;
  lastDonationAt: Date | null;
  distanceKm: number | null;
};
type RequestRow = {
  id: string;
  bloodGroup: string;
  units: number;
  urgency: 'NORMAL' | 'URGENT';
  hospitalName: string;
  city: string;
  expiresAt: Date;
  distanceKm: number | null;
};
@Injectable()
export class MatchingService {
  constructor(private readonly db: PrismaService) {}

  async donorsForRequest(request: BloodRequest) {
    const groups = compatibleDonorGroups(request.bloodGroup as BloodGroup);
    const latitude = request.latitude == null ? null : Number(request.latitude);
    const longitude = request.longitude == null ? null : Number(request.longitude);
    const near =
      latitude !== null && longitude !== null
        ? Prisma.sql`
      ((d."latitude" IS NOT NULL AND d."longitude" IS NOT NULL AND ST_DWithin(
        ST_SetSRID(ST_MakePoint(d."longitude"::double precision, d."latitude"::double precision), 4326)::geography,
        ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography, ${MATCH_RADIUS_KM * 1000}
      )) OR ((d."latitude" IS NULL OR d."longitude" IS NULL) AND lower(d."city") = lower(${request.city})))`
        : Prisma.sql`lower(d."city") = lower(${request.city})`;
    const distance =
      latitude !== null && longitude !== null
        ? Prisma.sql`
      CASE WHEN d."latitude" IS NOT NULL AND d."longitude" IS NOT NULL THEN
        ROUND((ST_Distance(
          ST_SetSRID(ST_MakePoint(d."longitude"::double precision, d."latitude"::double precision), 4326)::geography,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
        ) / 1000)::numeric, 1)::double precision ELSE NULL END`
        : Prisma.sql`NULL::double precision`;
    const rows = await this.db.$queryRaw<DonorRow[]>(Prisma.sql`
      SELECT d."id", d."bloodGroup", d."city", d."birthDate", d."weightKg", d."lastDonationAt", ${distance} AS "distanceKm"
      FROM "DonorProfile" d WHERE d."status" = 'APPROVED' AND d."consentToMatch" = true
      AND d."bloodGroup" IN (${Prisma.join(groups)}) AND ${near}
      ORDER BY "distanceKm" ASC NULLS LAST, d."createdAt" ASC LIMIT 100`);
    return rows
      .filter(
        (row) =>
          assessDonorEligibility({
            birthDate: row.birthDate,
            weightKg: Number(row.weightKg),
            lastDonationAt: row.lastDonationAt,
          }).length === 0,
      )
      .map(({ id, bloodGroup, city, distanceKm }) => ({ id, bloodGroup, city, distanceKm }));
  }

  async requestsForDonor(donor: DonorProfile) {
    const groups = compatibleRecipientGroups(donor.bloodGroup as BloodGroup);
    const latitude = donor.latitude == null ? null : Number(donor.latitude);
    const longitude = donor.longitude == null ? null : Number(donor.longitude);
    const near =
      latitude !== null && longitude !== null
        ? Prisma.sql`
      ((r."latitude" IS NOT NULL AND r."longitude" IS NOT NULL AND ST_DWithin(
        ST_SetSRID(ST_MakePoint(r."longitude"::double precision, r."latitude"::double precision), 4326)::geography,
        ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography, ${MATCH_RADIUS_KM * 1000}
      )) OR ((r."latitude" IS NULL OR r."longitude" IS NULL) AND lower(r."city") = lower(${donor.city})))`
        : Prisma.sql`lower(r."city") = lower(${donor.city})`;
    const distance =
      latitude !== null && longitude !== null
        ? Prisma.sql`
      CASE WHEN r."latitude" IS NOT NULL AND r."longitude" IS NOT NULL THEN
        ROUND((ST_Distance(
          ST_SetSRID(ST_MakePoint(r."longitude"::double precision, r."latitude"::double precision), 4326)::geography,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
        ) / 1000)::numeric, 1)::double precision ELSE NULL END`
        : Prisma.sql`NULL::double precision`;
    const rows = await this.db.$queryRaw<RequestRow[]>(Prisma.sql`
      SELECT r."id", r."bloodGroup", r."units", r."urgency", r."hospitalName", r."city", r."expiresAt", ${distance} AS "distanceKm"
      FROM "BloodRequest" r WHERE r."status" = 'OPEN' AND r."expiresAt" > NOW()
      AND r."bloodGroup" IN (${Prisma.join(groups)}) AND r."ownerId" <> ${donor.userId}::uuid AND ${near}
      ORDER BY CASE WHEN r."urgency" = 'URGENT' THEN 0 ELSE 1 END, "distanceKm" ASC NULLS LAST, r."createdAt" ASC LIMIT 100`);
    return rows;
  }

  async isRequestNearDonor(request: BloodRequest, donor: DonorProfile) {
    if (
      !compatibleDonorGroups(request.bloodGroup as BloodGroup).includes(
        donor.bloodGroup as BloodGroup,
      )
    )
      return false;
    if (
      assessDonorEligibility({
        birthDate: donor.birthDate,
        weightKg: Number(donor.weightKg),
        lastDonationAt: donor.lastDonationAt,
      }).length
    )
      return false;
    if (
      request.latitude == null ||
      request.longitude == null ||
      donor.latitude == null ||
      donor.longitude == null
    )
      return request.city.trim().toLowerCase() === donor.city.trim().toLowerCase();
    const rows = await this.db.$queryRaw<{ nearby: boolean }[]>(Prisma.sql`
      SELECT ST_DWithin(
        ST_SetSRID(ST_MakePoint(${Number(request.longitude)}, ${Number(request.latitude)}), 4326)::geography,
        ST_SetSRID(ST_MakePoint(${Number(donor.longitude)}, ${Number(donor.latitude)}), 4326)::geography,
        ${MATCH_RADIUS_KM * 1000}
      ) AS nearby`);
    return rows[0]?.nearby === true;
  }
}
