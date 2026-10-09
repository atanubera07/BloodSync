import { timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';

/** Browser cookie mutations require both the trusted Origin and a double-submit token. */
export function isAllowedMutation(
  req: Pick<Request, 'method' | 'headers' | 'cookies'>,
  webOrigin: string,
): boolean {
  const method = (req.method || '').toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return true;
  const origin = req.headers.origin;
  const hasSessionCookie = Boolean(req.cookies?.bs_access || req.cookies?.bs_refresh);
  if (!hasSessionCookie) return origin === undefined || origin === webOrigin;
  if (origin !== webOrigin) return false;
  const cookie = req.cookies?.bs_csrf;
  const header = req.headers['x-csrf-token'];
  if (typeof cookie !== 'string' || typeof header !== 'string' || cookie.length < 32) return false;
  const bufCookie = Buffer.from(cookie);
  const bufHeader = Buffer.from(header);
  if (bufCookie.length !== bufHeader.length) return false;
  return timingSafeEqual(bufCookie, bufHeader);
}
