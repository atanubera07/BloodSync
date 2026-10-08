import type { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import { createHash } from 'node:crypto';

const WINDOW_SECONDS = 15 * 60;
const POLICIES = [
  { path: /^\/auth\/login$/, limit: 20, name: 'login' },
  { path: /^\/auth\/register$/, limit: 10, name: 'signup' },
  { path: /^\/auth\/password\/(forgot|reset)$/, limit: 5, name: 'reset' },
  { path: /^\/auth\/verify-email(\/request)?$/, limit: 10, name: 'verification' },
  { path: /^\/contact$/, limit: 5, name: 'contact' },
  { path: /^\/donors\/me\/interests\//, limit: 15, name: 'interest' },
  { path: /^\/me\/consent$/, limit: 10, name: 'consent' },
  { path: /^\/me$/, limit: 3, name: 'account-delete' },
  { path: /^\/me\/export$/, limit: 5, name: 'data-export' },
];
const script = `local n = redis.call('INCR', KEYS[1]); if n == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]); end; return {n, redis.call('TTL', KEYS[1])}`;
export function rateLimit(redis: Redis) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const path = req.path.replace(/^\/v1(?=\/)/, '');
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && path !== '/me/export')
      return next();
    const policy = POLICIES.find((entry) => entry.path.test(path));
    if (!policy) return next();
    const address = req.ip || req.socket.remoteAddress || 'unknown';
    const identity =
      typeof req.body?.email === 'string' &&
      ['login', 'reset', 'verification'].includes(policy.name)
        ? `${address}:${req.body.email.trim().toLowerCase()}`
        : typeof req.body?.token === 'string' && ['reset', 'verification'].includes(policy.name)
          ? `${address}:${req.body.token}`
          : address;
    const digest = createHash('sha256').update(identity).digest('hex');
    try {
      const result = (await redis.eval(
        script,
        1,
        `limit:${policy.name}:${digest}`,
        WINDOW_SECONDS,
      )) as [number, number];
      if (result[0] > policy.limit) {
        res.setHeader('Retry-After', String(Math.max(1, result[1])));
        return res.status(429).json({ message: 'Too many attempts. Try again later.' });
      }
      next();
    } catch {
      res.status(503).json({ message: 'Service temporarily unavailable' });
    }
  };
}
