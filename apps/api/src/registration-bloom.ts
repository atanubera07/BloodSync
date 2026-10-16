import { Injectable } from '@nestjs/common';
import { createHmac } from 'node:crypto';
import { ConfigService } from './config';
import { RateLimitRedis } from './rate-limit-redis';

const KEY = 'bloodsync:registration-email:bloom:v1';
const BITS = 1 << 20; // 128 KiB, about 0.7% false positives at 100,000 entries.
const HASHES = 7;
const CHECK = `for i = 1, #ARGV do if redis.call('GETBIT', KEYS[1], tonumber(ARGV[i])) == 0 then return 0 end end return 1`;
const ADD = `for i = 1, #ARGV do redis.call('SETBIT', KEYS[1], tonumber(ARGV[i]), 1) end return 1`;

@Injectable()
export class RegistrationBloom {
  constructor(
    private readonly redis: RateLimitRedis,
    private readonly config: ConfigService,
  ) {}

  private offsets(email: string) {
    const digest = createHmac('sha256', this.config.values.SESSION_SECRET)
      .update('registration-bloom-v1\0')
      .update(email.toLowerCase())
      .digest();
    const first = digest.readUInt32BE(0);
    const second = (digest.readUInt32BE(4) | 1) >>> 0;
    return Array.from({ length: HASHES }, (_, index) => (first + index * second) % BITS);
  }

  async mightContain(email: string) {
    return (await this.redis.client.eval(CHECK, 1, KEY, ...this.offsets(email))) === 1;
  }

  async add(email: string) {
    await this.redis.client.eval(ADD, 1, KEY, ...this.offsets(email));
  }
}
