import {
  Injectable,
  OnApplicationBootstrap,
  OnApplicationShutdown,
  Optional,
} from '@nestjs/common';
import { Queue, Worker } from 'bullmq';
import { PrismaService } from './prisma.service';
import { ConfigService, readConfig } from './config';

/** A single repeatable BullMQ schedule is shared by all API instances. */
@Injectable()
export class RequestExpiryService implements OnApplicationBootstrap, OnApplicationShutdown {
  private queue?: Queue;
  private worker?: Worker;
  constructor(
    private readonly db: PrismaService,
    @Optional() private readonly config?: ConfigService,
  ) {}

  async expire() {
    return this.db.bloodRequest.updateMany({
      where: { status: 'OPEN', expiresAt: { lte: new Date() } },
      data: { status: 'EXPIRED' },
    });
  }

  async onApplicationBootstrap() {
    if (this.config?.values.VERCEL) return;
    const connection = {
      url: this.config?.values.REDIS_URL ?? readConfig().REDIS_URL,
      maxRetriesPerRequest: null,
    };
    this.queue = new Queue('request-expiry', { connection });
    this.worker = new Worker('request-expiry', async () => this.expire(), { connection });
    await this.queue.upsertJobScheduler(
      'expire-open-requests',
      { every: 60_000 },
      { name: 'expire' },
    );
  }

  async onApplicationShutdown() {
    await this.worker?.close();
    await this.queue?.close();
  }
}
