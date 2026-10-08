import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Request } from 'express';

function accessToken(req: Request): string | undefined {
  const cookie = req.cookies?.bs_access;
  if (typeof cookie === 'string' && cookie) return cookie;
  const header = req.headers.authorization;
  return typeof header === 'string' ? /^Bearer ([^\s]+)$/.exec(header)?.[1] : undefined;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request & { user?: unknown }>();
    const token = accessToken(req);
    if (!token) throw new UnauthorizedException();
    try {
      req.user = await this.auth.verifyAccess(token);
    } catch {
      throw new UnauthorizedException();
    }
    if (!req.user) throw new UnauthorizedException();
    return true;
  }
}

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request & { user?: { role: string } }>();
    const token = accessToken(req);
    if (!token) throw new UnauthorizedException();
    try {
      req.user = await this.auth.verifyAccess(token);
    } catch {
      throw new UnauthorizedException();
    }
    if (!req.user) throw new UnauthorizedException();
    if (req.user.role !== 'ADMIN') throw new ForbiddenException();
    return true;
  }
}
