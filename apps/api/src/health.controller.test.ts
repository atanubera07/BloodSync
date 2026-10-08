import { describe, expect, it, vi } from 'vitest';
import { ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from './health.controller';
import type { PrismaService } from './prisma.service';
import type { RateLimitRedis } from './rate-limit-redis';

describe('health routes', () => {
  it('reports liveness without dependencies and readiness only after both respond', async () => {
    const query = vi.fn().mockResolvedValue([1]);
    const ping = vi.fn().mockResolvedValue('PONG');
    const health = new HealthController(
      { $queryRaw: query } as unknown as PrismaService,
      { client: { ping } } as unknown as RateLimitRedis,
    );
    expect(health.live()).toEqual({ status: 'ok' });
    expect(query).not.toHaveBeenCalled();
    await expect(health.ready()).resolves.toEqual({ status: 'ok' });
    ping.mockRejectedValue(new Error('Redis unavailable'));
    await expect(health.ready()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
