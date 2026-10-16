import { describe, expect, it, vi } from 'vitest';
import { RegistrationBloom } from './registration-bloom';
import type { RateLimitRedis } from './rate-limit-redis';
import type { ConfigService } from './config';

describe('registration Bloom filter', () => {
  it('uses shared Redis bits to recognize a recently registered email', async () => {
    const bits = new Set<number>();
    const evalCommand = vi.fn(
      async (script: string, _keys: number, _key: string, ...offsets: number[]) => {
        expect(offsets).toHaveLength(7);
        expect(
          offsets.every((offset) => Number.isInteger(offset) && offset >= 0 && offset < 1 << 20),
        ).toBe(true);
        if (script.includes('GETBIT')) return offsets.every((offset) => bits.has(offset)) ? 1 : 0;
        offsets.forEach((offset) => bits.add(offset));
        return 1;
      },
    );
    const redis = { client: { eval: evalCommand } } as unknown as RateLimitRedis;
    const config = {
      values: { SESSION_SECRET: 'synthetic-secret-with-at-least-32-characters' },
    } as ConfigService;
    const first = new RegistrationBloom(redis, config);
    const second = new RegistrationBloom(redis, config);

    expect(await first.mightContain('SYNTHETIC@example.test')).toBe(false);
    await first.add('synthetic@example.test');
    expect(await second.mightContain('SYNTHETIC@example.test')).toBe(true);
    expect(JSON.stringify(evalCommand.mock.calls)).not.toContain('synthetic@example.test');
  });
});
