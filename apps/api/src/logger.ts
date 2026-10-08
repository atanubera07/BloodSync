import type { LoggerService } from '@nestjs/common';
import pino from 'pino';

export function safeMessage(message: unknown): string {
  return String(message)
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[EMAIL]')
    .replace(/Bearer\s+[^\s]+/gi, 'Bearer [REDACTED]')
    .replace(/(bs_access|bs_refresh|bs_csrf|token|password)=([^\s;&]+)/gi, '$1=[REDACTED]');
}
export const log = pino({
  level: 'info',
  redact: {
    paths: [
      'password',
      'token',
      'access',
      'refresh',
      'email',
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
      'req.body.token',
      'req.body.email',
      '*.password',
      '*.token',
      '*.email',
    ],
    censor: '[REDACTED]',
  },
});
export class ApiLogger implements LoggerService {
  log(message: unknown, context?: string) {
    log.info({ context }, safeMessage(message));
  }
  error(message: unknown, _trace?: string, context?: string) {
    log.error({ context }, safeMessage(message));
  }
  warn(message: unknown, context?: string) {
    log.warn({ context }, safeMessage(message));
  }
  debug(message: unknown, context?: string) {
    log.debug({ context }, safeMessage(message));
  }
}
