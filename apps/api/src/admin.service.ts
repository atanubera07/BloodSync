import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { assessDonorEligibility } from '@bloodsync/shared';
import { z } from 'zod';
import { PrismaService } from './prisma.service';
import type { Actor } from './actor';
@Injectable()
export class AdminService {
  constructor(private readonly db: PrismaService) {}
  private requireAdmin(actor: Actor) { if (actor.role !== 'ADMIN') throw new ForbiddenException('Admin role required'); }
  async pendingDonors(actor: Actor) {
    this.requireAdmin(actor);
    return this.db.donorProfile.findMany({
      where: { status: 'PENDING' },
      select: { id: true, bloodGroup: true, birthDate: true, weightKg: true, lastDonationAt: true, city: true, consentToMatch: true, createdAt: true, user: { select: { fullName: true, email: true } } },
      orderBy: { createdAt: 'asc' }, take: 100,
    });
  }
  async reviewDonor(actor: Actor, idInput: string, decision: 'APPROVED' | 'REJECTED') {
    this.requireAdmin(actor);
    const id = z.uuid().safeParse(idInput);
    if (!id.success) throw new BadRequestException('Invalid donor ID');
    const profile = await this.db.donorProfile.findUnique({ where: { id: id.data } });
    if (!profile) throw new NotFoundException('Donor profile not found');
    if (profile.userId === actor.id) throw new ForbiddenException('Cannot review your own profile');
    if (profile.status !== 'PENDING') throw new ConflictException('Profile already reviewed');
    if (decision === 'APPROVED') {
      const reasons = assessDonorEligibility({ birthDate: profile.birthDate, weightKg: Number(profile.weightKg), lastDonationAt: profile.lastDonationAt });
      if (reasons.length) throw new UnprocessableEntityException({ message: 'Donor screening did not pass', reasons });
    }
    return this.db.$transaction(async tx => {
      const changed = await tx.donorProfile.updateMany({ where: { id: profile.id, status: 'PENDING', updatedAt: profile.updatedAt }, data: { status: decision } });
      if (changed.count !== 1) throw new ConflictException('Profile changed; reload and review again');
      await tx.auditEvent.create({ data: { actorId: actor.id, targetId: profile.id, action: `DONOR_${decision}` } });
      return { ok: true, status: decision };
    });
  }
  async audit(actor: Actor) {
    this.requireAdmin(actor);
    return this.db.auditEvent.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
  }
}
