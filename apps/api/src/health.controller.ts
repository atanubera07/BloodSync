import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { Public } from './public';
import { PrismaService } from './prisma.service';
import { RateLimitRedis } from './rate-limit-redis';
@Controller('health')
export class HealthController {
  constructor(
    private readonly db: PrismaService,
    private readonly redis: RateLimitRedis,
  ) {}
  @Public() @Get() check() {
    return this.live();
  }
  @Public() @Get('live') live() {
    return { status: 'ok' };
  }
  @Public() @Get('ready') async ready() {
    try {
      await Promise.all([this.db.$queryRaw`SELECT 1`, this.redis.client.ping()]);
      return { status: 'ok' };
    } catch {
      throw new ServiceUnavailableException('Dependencies unavailable');
    }
  }
}
