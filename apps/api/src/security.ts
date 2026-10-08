import type { Request } from 'express';

/** Browser cookies require an exact trusted Origin for every state change. */
export function isAllowedMutation(
  req: Pick<Request, 'method' | 'headers' | 'cookies'>,
  webOrigin: string,
): boolean {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return true;
  const origin = req.headers.origin;
  const hasSessionCookie = Boolean(req.cookies?.bs_access || req.cookies?.bs_refresh);
  if (hasSessionCookie) return origin === webOrigin;
  return origin === undefined || origin === webOrigin;
}
