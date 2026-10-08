import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from './config';

@Injectable()
export class RateLimitRedis implements OnApplicationShutdown {
  readonly client: Redis;
  constructor(config: ConfigService) {
    this.client = new Redis(config.values.REDIS_URL, { maxRetriesPerRequest: 1 });
  }

  async onApplicationShutdown() {
    await this.client.quit();
  }
}
