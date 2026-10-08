import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { assessDonorEligibility, donorProfileSchema } from '@bloodsync/shared';
import { z } from 'zod';
import { PrismaService } from './prisma.service';
import { MatchingService } from './matching.service';
import { requireUser, type Actor } from './actor';
import { coarseCoordinate } from './geo';

@Injectable()
export class DonorService {
  constructor(private readonly db: PrismaService, private readonly matching: MatchingService) {}
  async getOwn(actor: Actor) {
    requireUser(actor);
    const profile = await this.db.donorProfile.findUnique({ where: { userId: actor.id } });
    if (!profile) throw new NotFoundException('Donor profile not found');
    return profile;
  }
  async saveOwn(actor: Actor, input: unknown) {
    requireUser(actor);
    const parsed = donorProfileSchema.safeParse(input);
    if (!parsed.success) throw new BadRequestException('Invalid donor profile');
    const data = parsed.data;
    const birthDate = new Date(data.birthDate);
    const lastDonationAt = data.lastDonationAt ? new Date(data.lastDonationAt) : null;
    const reasons = assessDonorEligibility({ birthDate, weightKg: data.weightKg, lastDonationAt });
    if (reasons.length) throw new UnprocessableEntityException({ message: 'Donor screening did not pass', reasons });
    return this.db.$transaction(async tx => {
      await tx.requestInterest.deleteMany({ where: { userId: actor.id } });
      return tx.donorProfile.upsert({
        where: { userId: actor.id },
        create: { userId: actor.id, bloodGroup: data.bloodGroup, birthDate, weightKg: data.weightKg, lastDonationAt, city: data.city, latitude: coarseCoordinate(data.latitude), longitude: coarseCoordinate(data.longitude), consentToMatch: data.consentToMatch },
        update: { bloodGroup: data.bloodGroup, birthDate, weightKg: data.weightKg, lastDonationAt, city: data.city, latitude: coarseCoordinate(data.latitude), longitude: coarseCoordinate(data.longitude), consentToMatch: data.consentToMatch, status: 'PENDING' },
      });
    });
  }
  async matches(actor: Actor) {
    const profile = await this.getOwn(actor);
    if (profile.status !== 'APPROVED' || !profile.consentToMatch) throw new ForbiddenException('Approved matching consent required');
    const requests = await this.matching.requestsForDonor(profile);
    const interests = await this.db.requestInterest.findMany({ where: { donorId: profile.id, requestId: { in: requests.map(request => request.id) } }, select: { requestId: true } });
    const responded = new Set(interests.map(item => item.requestId));
    return requests.map(request => ({ ...request, responded: responded.has(request.id) }));
  }
  async expressInterest(actor: Actor, requestIdInput: string) {
    const requestId = z.uuid().safeParse(requestIdInput);
    if (!requestId.success) throw new BadRequestException('Invalid request ID');
    const donor = await this.getOwn(actor);
    if (donor.status !== 'APPROVED' || !donor.consentToMatch) throw new ForbiddenException('Approved matching consent required');
    const request = await this.db.bloodRequest.findUnique({ where: { id: requestId.data } });
    if (!request || request.status !== 'OPEN' || request.expiresAt <= new Date()) throw new NotFoundException('Active request not found');
    if (request.ownerId === actor.id) throw new ForbiddenException('Cannot respond to your own request');
    if (!await this.matching.isRequestNearDonor(request, donor)) throw new ForbiddenException('Request does not match your profile');
    await this.db.requestInterest.upsert({
      where: { requestId_donorId: { requestId: request.id, donorId: donor.id } },
      create: { requestId: request.id, donorId: donor.id, userId: actor.id },
      update: {},
    });
    return { ok: true };
  }
}
