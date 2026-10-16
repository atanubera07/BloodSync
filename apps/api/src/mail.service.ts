import { Injectable, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import nodemailer from 'nodemailer';
import { ConfigService } from './config';
import { Queue, Worker } from 'bullmq';
import { randomBytes, createHash } from 'node:crypto';
import { PrismaService } from './prisma.service';
@Injectable()
export class MailService implements OnApplicationBootstrap, OnApplicationShutdown {
  private queue?: Queue;
  private worker?: Worker;
  constructor(
    private readonly db: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    if (this.config.values.VERCEL) return;
    const connection = { url: this.config.values.REDIS_URL, maxRetriesPerRequest: null };
    this.queue = new Queue('account-email', {
      connection: { url: connection.url, maxRetriesPerRequest: 1, enableOfflineQueue: false },
    });
    this.worker = new Worker<{ email: string; kind: 'VERIFY' | 'RESET' }>(
      'account-email',
      async (job) => this.process(job.data.email, job.data.kind),
      { connection },
    );
  }

  async enqueue(email: string, kind: 'VERIFY' | 'RESET') {
    if (this.config.values.VERCEL) {
      const { send } = await import('@vercel/queue');
      await send('account-email', { email, kind });
      return;
    }
    if (!this.queue) throw new Error('Account email queue is not ready');
    await this.queue.add(
      'send',
      { email, kind },
      { removeOnComplete: true, attempts: 3, backoff: { type: 'exponential', delay: 1000 } },
    );
  }

  async onApplicationShutdown() {
    await this.worker?.close();
    await this.queue?.close();
  }

  async process(email: string, kind: 'VERIFY' | 'RESET') {
    const user = await this.db.user.findUnique({
      where: { email },
      select: { id: true, email: true, emailVerifiedAt: true },
    });
    if (!user || (kind === 'VERIFY' && user.emailVerifiedAt)) return;
    const token = randomBytes(32).toString('base64url');
    await this.db.emailToken.create({
      data: {
        userId: user.id,
        kind,
        tokenHash: createHash('sha256').update(token).digest('hex'),
        expiresAt: new Date(Date.now() + (kind === 'VERIFY' ? 86_400_000 : 1_800_000)),
      },
    });
    await this.sendAction(user.email, kind === 'VERIFY' ? 'verify' : 'reset', token);
  }

  async sendAction(email: string, kind: 'verify' | 'reset', token: string) {
    const config = this.config.values;
    const url = new URL(kind === 'verify' ? '/verify-email' : '/reset-password', config.WEB_ORIGIN);
    url.searchParams.set('token', token);
    const transport = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_PORT === 465,
      ...(config.SMTP_USER && config.SMTP_PASS
        ? { auth: { user: config.SMTP_USER, pass: config.SMTP_PASS } }
        : {}),
    });
    await transport.sendMail({
      from: config.MAIL_FROM,
      to: email,
      subject: kind === 'verify' ? 'Verify your BloodSync email' : 'Reset your BloodSync password',
      text: `Open this link to ${kind === 'verify' ? 'verify your email' : 'reset your password'}: ${url.toString()}\n\nIf you did not request this, ignore this message.`,
    });
  }
}
