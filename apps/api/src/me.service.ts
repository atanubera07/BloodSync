import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from './prisma.service';
import type { Actor } from './actor';
import { verifyPassword } from './password';
import { PRIVACY_VERSION, consentSchema, deleteAccountSchema } from '@bloodsync/shared';
import type { z } from 'zod';

@Injectable()
export class MeService {
  constructor(private readonly db: PrismaService) {}
  async consent(actor: Actor) {
    return this.db.consentRecord.findFirst({
      where: { userId: actor.id },
      orderBy: { grantedAt: 'desc' },
    });
  }
  async grantConsent(actor: Actor, input: z.infer<typeof consentSchema>) {
    if (!input || typeof input !== 'object')
      throw new BadRequestException('Consent choices required');
    const data = input as Record<string, unknown>;
    if (
      data.privacyVersion !== PRIVACY_VERSION ||
      data.healthProcessing !== true ||
      typeof data.contactSharing !== 'boolean'
    )
      throw new BadRequestException('Review the current privacy policy and consent choices');
    return this.db.$transaction(async (tx) => {
      await tx.consentRecord.updateMany({
        where: { userId: actor.id, withdrawnAt: null },
        data: { withdrawnAt: new Date() },
      });
      return tx.consentRecord.create({
        data: {
          userId: actor.id,
          privacyVersion: PRIVACY_VERSION,
          healthProcessing: true,
          contactSharing: data.contactSharing as boolean,
        },
      });
    });
  }
  async withdrawConsent(actor: Actor) {
    await this.db.$transaction(async (tx) => {
      await tx.consentRecord.updateMany({
        where: { userId: actor.id, withdrawnAt: null },
        data: { withdrawnAt: new Date() },
      });
      await tx.donorProfile.updateMany({
        where: { userId: actor.id },
        data: { consentToMatch: false },
      });
      await tx.requestInterest.deleteMany({ where: { userId: actor.id } });
    });
    return { ok: true };
  }
  async export(actor: Actor) {
    const user = await this.db.user.findUnique({
      where: { id: actor.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        phoneNumber: true,
        declaredBloodGroup: true,
        postalAddress: true,
        city: true,
        stateRegion: true,
        termsAcceptedAt: true,
        role: true,
        emailVerifiedAt: true,
        createdAt: true,
      },
    });
    if (!user) throw new UnauthorizedException();
    return {
      user,
      donorProfile: await this.db.donorProfile.findUnique({ where: { userId: actor.id } }),
      requests: await this.db.bloodRequest.findMany({
        where: { ownerId: actor.id },
      }),
      interests: await this.db.requestInterest.findMany({ where: { userId: actor.id } }),
      consents: await this.db.consentRecord.findMany({ where: { userId: actor.id } }),
      sessions: await this.db.session.findMany({
        where: { userId: actor.id },
        select: { id: true, createdAt: true, expiresAt: true, revokedAt: true },
      }),
      emailTokens: await this.db.emailToken.findMany({
        where: { userId: actor.id },
        select: { kind: true, createdAt: true, expiresAt: true, usedAt: true },
      }),
      auditEvents: await this.db.auditEvent.findMany({
        where: { actorId: actor.id },
        select: { action: true, createdAt: true, result: true },
      }),
    };
  }
  async delete(actor: Actor, input: z.infer<typeof deleteAccountSchema>) {
    const password =
      input && typeof input === 'object' ? (input as Record<string, unknown>).password : undefined;
    if (typeof password !== 'string')
      throw new BadRequestException('Password confirmation required');
    const user = await this.db.user.findUnique({ where: { id: actor.id } });
    if (!user || !(await verifyPassword(user.passwordHash, password)))
      throw new ForbiddenException('Password confirmation failed');
    const donor = await this.db.donorProfile.findUnique({
      where: { userId: actor.id },
      select: { id: true },
    });
    await this.db.$transaction(async (tx) => {
      await tx.auditEvent.updateMany({
        where: { actorId: actor.id },
        data: { actorId: null, targetId: null, ipHash: null },
      });
      await tx.auditEvent.updateMany({
        where: { targetId: { in: [actor.id, ...(donor ? [donor.id] : [])] } },
        data: { targetId: null },
      });
      await tx.user.delete({ where: { id: actor.id } });
    });
    return { ok: true };
  }
}
