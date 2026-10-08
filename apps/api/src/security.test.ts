import { describe, expect, it } from 'vitest';
import type { Request } from 'express';
import { isAllowedMutation } from './security';
const origin = 'https://bloodsync.example';
function request(method: string, headerOrigin?: string, cookie = true) {
  return {
    method,
    headers: headerOrigin === undefined ? {} : { origin: headerOrigin },
    cookies: cookie ? { bs_access: 'session' } : {},
  } as Pick<Request, 'method' | 'headers' | 'cookies'>;
}
describe('cookie mutation origin check', () => {
  it('rejects missing, foreign and null origins with session cookies', () => {
    expect(isAllowedMutation(request('POST'), origin)).toBe(false);
    expect(isAllowedMutation(request('PATCH', 'https://attacker.example'), origin)).toBe(false);
    expect(isAllowedMutation(request('DELETE', 'null'), origin)).toBe(false);
  });
  it('allows trusted origin and safe reads', () => {
    expect(isAllowedMutation(request('POST', origin), origin)).toBe(true);
    expect(isAllowedMutation(request('GET'), origin)).toBe(true);
  });
  it('allows non-browser bearer clients without cookies and rejects a foreign origin', () => {
    expect(isAllowedMutation(request('POST', undefined, false), origin)).toBe(true);
    expect(isAllowedMutation(request('POST', 'https://attacker.example', false), origin)).toBe(
      false,
    );
  });
});
