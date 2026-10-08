import { describe, expect, it } from 'vitest';
import { safeMessage } from './logger';
describe('log hygiene', () => {
  it('removes email, bearer, cookie token and password values', () => {
    const output = safeMessage(
      'person@example.test Bearer abc123 bs_refresh=secret-token password=supersecret',
    );
    for (const secret of ['person@example.test', 'abc123', 'secret-token', 'supersecret'])
      expect(output).not.toContain(secret);
  });
});
