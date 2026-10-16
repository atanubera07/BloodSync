import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './password';

const nativeArgon2Vector =
  '$argon2id$v=19$m=19456,t=2,p=1$AQEBAQEBAQEBAQEBAQEBAQ$zYGxYjzGMGib/zIQpACQIoDdOx2kP9R7XyD8Tc9/HQU';

describe('password hashes', () => {
  it('round-trips a new hash and rejects a wrong password', async () => {
    const hash = await hashPassword('correct-long-password');
    expect(hash).toMatch(/^\$argon2id\$v=19\$m=19456,t=2,p=1\$/);
    expect(await verifyPassword(hash, 'correct-long-password')).toBe(true);
    expect(await verifyPassword(hash, 'wrong-password')).toBe(false);
  });

  it('verifies the previous native Argon2 PHC format', async () => {
    expect(await verifyPassword(nativeArgon2Vector, 'known-test-password')).toBe(true);
    expect(await verifyPassword(nativeArgon2Vector, 'wrong-password')).toBe(false);
  });

  it('rejects malformed or excessive cost parameters', async () => {
    expect(await verifyPassword('bad-hash', 'password')).toBe(false);
    expect(
      await verifyPassword(nativeArgon2Vector.replace('m=19456', 'm=999999'), 'password'),
    ).toBe(false);
  });
});
