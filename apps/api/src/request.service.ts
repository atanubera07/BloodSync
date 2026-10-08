import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { requestSchema, requestUpdateSchema } from '@bloodsync/shared';
import { z } from 'zod';
import { PrismaService } from './prisma.service';
import { MatchingService } from './matching.service';
import { requireUser, type Actor } from './actor';
import { coarseCoordinate } from './geo';

@Injectable()
export class RequestService {
  constructor(
    private readonly db: PrismaService,
    private readonly matching: MatchingService,
  ) {}
  private id(value: string) {
    const parsed = z.uuid().safeParse(value);
    if (!parsed.success) throw new BadRequestException('Invalid request ID');
    return parsed.data;
  }
  private expiry(value: string) {
    const date = new Date(value);
    const gap = date.getTime() - Date.now();
    if (!Number.isFinite(gap) || gap < 15 * 60_000 || gap > 30 * 24 * 60 * 60_000)
      throw new BadRequestException('Expiry must be 15 minutes to 30 days ahead');
    return date;
  }
  async create(actor: Actor, input: unknown) {
    requireUser(actor);
    const parsed = requestSchema.safeParse(input);
    if (!parsed.success) throw new BadRequestException('Invalid blood request');
    const data = parsed.data;
    return this.db.bloodRequest.create({
      data: {
        ownerId: actor.id,
        bloodGroup: data.bloodGroup,
        units: data.units,
        urgency: data.urgency,
        hospitalName: data.hospitalName,
        city: data.city,
        latitude: coarseCoordinate(data.latitude),
        longitude: coarseCoordinate(data.longitude),
        expiresAt: this.expiry(data.expiresAt),
      },
    });
  }
  private visibleStatus<T extends { status: string; expiresAt: Date }>(request: T): T {
    return request.status === 'OPEN' && request.expiresAt <= new Date()
      ? { ...request, status: 'EXPIRED' }
      : request;
  }
  async listOwn(actor: Actor) {
    requireUser(actor);
    const requests = await this.db.bloodRequest.findMany({
      where: { ownerId: actor.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return requests.map((request) => this.visibleStatus(request));
  }
  async getOwn(actor: Actor, idInput: string) {
    requireUser(actor);
    const id = this.id(idInput);
    const request = await this.db.bloodRequest.findFirst({ where: { id, ownerId: actor.id } });
    if (!request) throw new NotFoundException('Blood request not found');
    return this.visibleStatus(request);
  }
  async updateOwn(actor: Actor, idInput: string, input: unknown) {
    const request = await this.getOwn(actor, idInput);
    if (request.status !== 'OPEN' || request.expiresAt <= new Date())
      throw new ConflictException('Request is no longer open');
    const parsed = requestUpdateSchema.safeParse(input);
    if (!parsed.success) throw new BadRequestException('Invalid request changes');
    const data = parsed.data;
    const { expiresAt, latitude, longitude, ...otherChanges } = data;
    const changes = {
      ...otherChanges,
      ...(latitude !== undefined ? { latitude: coarseCoordinate(latitude) } : {}),
      ...(longitude !== undefined ? { longitude: coarseCoordinate(longitude) } : {}),
    };
    return this.db.$transaction(async (tx) => {
      const updated = await tx.bloodRequest.updateMany({
        where: { id: request.id, ownerId: actor.id, status: 'OPEN', expiresAt: { gt: new Date() } },
        data: { ...changes, ...(expiresAt ? { expiresAt: this.expiry(expiresAt) } : {}) },
      });
      if (updated.count !== 1) throw new ConflictException('Request changed; reload and try again');
      await tx.requestInterest.deleteMany({ where: { requestId: request.id } });
      return tx.bloodRequest.findUniqueOrThrow({ where: { id: request.id } });
    });
  }
  async closeOwn(actor: Actor, idInput: string) {
    const request = await this.getOwn(actor, idInput);
    const updated = await this.db.bloodRequest.updateMany({
      where: { id: request.id, ownerId: actor.id, status: 'OPEN', expiresAt: { gt: new Date() } },
      data: { status: 'CLOSED' },
    });
    if (updated.count !== 1) throw new ConflictException('Request is already closed');
    return { ok: true };
  }
  async matches(actor: Actor, idInput: string) {
    const request = await this.getOwn(actor, idInput);
    if (request.status !== 'OPEN' || request.expiresAt <= new Date()) return [];
    return this.matching.donorsForRequest(request);
  }
  async interests(actor: Actor, idInput: string) {
    const request = await this.getOwn(actor, idInput);
    return this.db.requestInterest.findMany({
      where: { requestId: request.id },
      select: {
        id: true,
        consentAt: true,
        donor: {
          select: {
            bloodGroup: true,
            city: true,
            user: { select: { fullName: true, email: true } },
          },
        },
      },
      orderBy: { consentAt: 'desc' },
      take: 100,
    });
  }
}
