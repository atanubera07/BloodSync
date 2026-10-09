import { describe, expect, it } from 'vitest';
import type { Request } from 'express';
import { isAllowedMutation } from './security';
const origin = 'https://bloodsync.example';
const token = 'a'.repeat(43);
function request(method: string, headerOrigin?: string, csrf?: string, cookie = true) {
  return {
    method,
    headers: { origin: headerOrigin, 'x-csrf-token': csrf },
    cookies: cookie ? { bs_access: 'session', bs_csrf: token } : {},
  } as Pick<Request, 'method' | 'headers' | 'cookies'>;
}
describe('cookie mutation CSRF protection', () => {
  it('rejects missing and foreign origins', () => {
    expect(isAllowedMutation(request('POST', undefined, token), origin)).toBe(false);
    expect(isAllowedMutation(request('PATCH', 'https://attacker.example', token), origin)).toBe(
      false,
    );
  });
  it('rejects missing and wrong tokens', () => {
    expect(isAllowedMutation(request('POST', origin), origin)).toBe(false);
    expect(isAllowedMutation(request('POST', origin, 'b'.repeat(43)), origin)).toBe(false);
  });
  it('allows a valid token and safe reads', () => {
    expect(isAllowedMutation(request('POST', origin, token), origin)).toBe(true);
    expect(isAllowedMutation(request('GET'), origin)).toBe(true);
    expect(isAllowedMutation(request('get'), origin)).toBe(true);
  });
  it('handles multi-byte headers without throwing', () => {
    const multiByteToken = 'a'.repeat(42) + '€';
    expect(isAllowedMutation(request('POST', origin, multiByteToken), origin)).toBe(false);
  });
  it('allows non-browser clients without cookies or foreign origins', () => {
    expect(isAllowedMutation(request('POST', undefined, undefined, false), origin)).toBe(true);
    expect(
      isAllowedMutation(request('POST', 'https://attacker.example', undefined, false), origin),
    ).toBe(false);
  });
});
