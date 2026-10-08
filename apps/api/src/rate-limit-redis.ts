import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import type Redis from 'ioredis';
import { ConfigService } from './config';

// Vercel's bundle exposes the CommonJS package through an interop shim.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const redisModule: unknown = require('ioredis');
function redisConstructor(value: unknown): typeof Redis {
  if (typeof value === 'function') return value as typeof Redis;
  if (value && typeof value === 'object') {
    const exports = value as { default?: unknown; Redis?: unknown };
    if (typeof exports.Redis === 'function') return exports.Redis as typeof Redis;
    if (typeof exports.default === 'function') return exports.default as typeof Redis;
  }
  throw new Error('Unable to load Redis client');
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
