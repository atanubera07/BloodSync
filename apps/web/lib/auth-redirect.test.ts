import { describe, expect, it } from 'vitest';
import { safeAuthDestination } from './auth-redirect';

describe('post sign-in destination', () => {
  it('returns to an allowed BloodSync task', () => {
    expect(safeAuthDestination('/requests/new')).toBe('/requests/new');
    expect(safeAuthDestination('/donor/profile')).toBe('/donor/profile');
  });

  it('rejects external and unrelated paths', () => {
    for (const path of [
      '//example.test',
      'https://example.test',
      '/api/v1/me',
      '/%2fexample.test',
    ]) {
      expect(safeAuthDestination(path)).toBe('/dashboard');
    }
  });
});
