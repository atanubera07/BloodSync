import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import type Redis from 'ioredis';
import { ConfigService } from './config';

// Vercel's bundle exposes the CommonJS package through an interop shim.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const redisModule: unknown = require('ioredis');
function redisConstructor(value: unknown, depth = 0): typeof Redis {
  if (typeof value === 'function') return value as typeof Redis;
  if (value && typeof value === 'object' && depth < 6) {
    const exports = value as { default?: unknown; Redis?: unknown };
    for (const candidate of [exports.Redis, exports.default]) {
      if (candidate) {
        try {
          return redisConstructor(candidate, depth + 1);
        } catch {
          // Try the other export shape.
        }
      }
    }
  }
  throw new Error(
    `Unable to load Redis client: ${typeof value}${value && typeof value === 'object' ? ` keys ${Object.keys(value).join(',')}` : ''}`,
  );
}
const RedisClient = redisConstructor(redisModule);

@Injectable()
export class RateLimitRedis implements OnApplicationShutdown {
  readonly client: Redis;
  constructor(config: ConfigService) {
    this.client = new RedisClient(config.values.REDIS_URL, { maxRetriesPerRequest: 1 });
  }

  async onApplicationShutdown() {
    await this.client.quit();
  }
}
