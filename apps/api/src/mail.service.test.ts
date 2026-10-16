import { describe, expect, it, vi } from 'vitest';
import { MailService } from './mail.service';
import type { ConfigService } from './config';
import type { PrismaService } from './prisma.service';

const { send } = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock('@vercel/queue', () => ({ send }));

describe('Vercel account email', () => {
  it('publishes a job without starting a persistent BullMQ worker', async () => {
    const config = { values: { VERCEL: '1' } } as ConfigService;
    const mail = new MailService({} as PrismaService, config);
    await mail.onApplicationBootstrap();
    await mail.enqueue('synthetic@example.test', 'VERIFY');
    expect(send).toHaveBeenCalledWith('account-email', {
      email: 'synthetic@example.test',
      kind: 'VERIFY',
    });
    await mail.onApplicationShutdown();
  });
});
