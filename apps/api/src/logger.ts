import type { LoggerService } from '@nestjs/common';
import pino from 'pino';
const log = pino({ level: process.env.NODE_ENV === 'production' ? 'info' : 'debug', redact: { paths: ['password', 'token', 'access', 'refresh', 'req.headers.authorization', 'req.headers.cookie'], censor: '[REDACTED]' } });
export class ApiLogger implements LoggerService {
  log(message: unknown, context?: string) { log.info({ context }, String(message)); }
  error(message: unknown, _trace?: string, context?: string) { log.error({ context }, String(message)); }
  warn(message: unknown, context?: string) { log.warn({ context }, String(message)); }
  debug(message: unknown, context?: string) { log.debug({ context }, String(message)); }
}
