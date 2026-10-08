import { Injectable, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { Queue, Worker } from 'bullmq';
import { PrismaService } from './prisma.service';

/** A single repeatable BullMQ schedule is shared by all API instances. */
@Injectable()
export class RequestExpiryService implements OnApplicationBootstrap, OnApplicationShutdown {
  private queue?: Queue;
  private worker?: Worker;
  constructor(private readonly db: PrismaService) {}

  async expire() {
    return this.db.bloodRequest.updateMany({
      where: { status: 'OPEN', expiresAt: { lte: new Date() } },
      data: { status: 'EXPIRED' },
    });
  }

  async onApplicationBootstrap() {
    const connection = {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
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
