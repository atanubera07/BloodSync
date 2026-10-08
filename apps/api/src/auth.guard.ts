import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Request } from 'express';
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request & { user?: unknown }>();
    const bearer = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
    req.user = await this.auth.verifyAccess(req.cookies?.bs_access || bearer);
    return true;
  }
}
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request & { user?: { role: string } }>();
    req.user = await this.auth.verifyAccess(
      req.cookies?.bs_access || req.headers.authorization?.match(/^Bearer (.+)$/)?.[1],
    );
    if (!req.user) throw new UnauthorizedException();
    if (req.user.role !== 'ADMIN') throw new ForbiddenException();
    return true;
  }
}
