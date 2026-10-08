import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, catchError, mergeMap } from 'rxjs';
import { createHmac } from 'node:crypto';
import type { Request } from 'express';
import { PrismaService } from './prisma.service';
import { ConfigService } from './config';
import { derivedKey } from './auth.service';

function eventFor(
  method: string,
  path: string,
  status: 'SUCCESS' | 'FAILURE',
  httpStatus?: number,
) {
  if (path === '/auth/login')
    return status === 'FAILURE' ? (httpStatus === 429 ? 'LOGIN_LOCKOUT' : 'LOGIN_FAILED') : 'LOGIN';
  if (path === '/auth/password/reset') return 'PASSWORD_RESET';
  if (/^\/admin\/donors\/[^/]+\/(approve|reject)$/.test(path)) return 'DONOR_REVIEW';
  if (/^\/donors\/me\/interests\//.test(path)) return 'CONTACT_SHARING';
  if (path === '/me/export') return 'DATA_EXPORT';
  if (path === '/me' && method === 'DELETE') return 'ACCOUNT_DELETION';
  if (path === '/me/consent') return method === 'DELETE' ? 'CONSENT_WITHDRAWN' : 'CONSENT_GRANTED';
  return null;
}
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly db: PrismaService,
    private readonly config: ConfigService,
  ) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request & { user?: { id: string } }>();
    const path = req.path.replace(/^\/v1(?=\/)/, '');
    const method = req.method;
    const record = async (result: 'SUCCESS' | 'FAILURE', httpStatus?: number) => {
      const action = eventFor(method, path, result, httpStatus);
      if (!action) return;
      const deleting = path === '/me' && method === 'DELETE' && result === 'SUCCESS';
      const ipHash = createHmac('sha256', derivedKey(this.config.values.SESSION_SECRET, 'audit-ip'))
        .update(req.ip || req.socket.remoteAddress || 'unknown')
        .digest('hex');
      await this.db.auditEvent.create({
        data: {
          action,
          actorId: deleting ? null : req.user?.id,
          ipHash: deleting ? null : ipHash,
          result,
        },
      });
    };
    return next.handle().pipe(
      mergeMap(async (value) => {
        await record('SUCCESS');
        return value;
      }),
      catchError(async (error) => {
        await record('FAILURE', typeof error?.status === 'number' ? error.status : undefined);
        throw error;
      }),
    );
  }
}
