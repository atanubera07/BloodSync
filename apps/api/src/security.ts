import { timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';

/** Browser cookie mutations require both the trusted Origin and a double-submit token. */
export function isAllowedMutation(
  req: Pick<Request, 'method' | 'headers' | 'cookies'>,
  webOrigin: string,
): boolean {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return true;
  const origin = req.headers.origin;
  const hasSessionCookie = Boolean(req.cookies?.bs_access || req.cookies?.bs_refresh);
  if (!hasSessionCookie) return origin === undefined || origin === webOrigin;
  if (origin !== webOrigin) return false;
  const cookie = req.cookies?.bs_csrf;
  const header = req.headers['x-csrf-token'];
  if (
    typeof cookie !== 'string' ||
    typeof header !== 'string' ||
    cookie.length < 32 ||
    cookie.length !== header.length
  )
    return false;
  return timingSafeEqual(Buffer.from(cookie), Buffer.from(header));
}
