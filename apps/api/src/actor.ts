import { ForbiddenException } from '@nestjs/common';
import type { Request } from 'express';
export type Actor = { id: string; role: 'USER' | 'ADMIN'; email: string; fullName: string };
export type AuthRequest = Request & { user: Actor };
export function requireUser(actor: Actor) {
  if (actor.role !== 'USER') throw new ForbiddenException('This action requires a user account');
}
