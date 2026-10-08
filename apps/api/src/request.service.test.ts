import { describe, expect, it, vi } from 'vitest';
import { RequestService } from './request.service';
import { RequestExpiryService } from './request-expiry.service';
import type { PrismaService } from './prisma.service';
import type { MatchingService } from './matching.service';
const actor = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  role: 'USER' as const,
  email: 'user@example.test',
  fullName: 'Test User',
};
const stale = { id: 'a', status: 'OPEN', expiresAt: new Date(0) };
describe('request expiry', () => {
  it('shows stale owned requests as expired without writing on reads', async () => {
    const updateMany = vi.fn();
    const db = {
      bloodRequest: {
        updateMany,
        findMany: vi.fn().mockResolvedValue([stale]),
        findFirst: vi.fn().mockResolvedValue(stale),
      },
    } as unknown as PrismaService;
    const service = new RequestService(db, {} as MatchingService);
    expect((await service.listOwn(actor))[0].status).toBe('EXPIRED');
    expect((await service.getOwn(actor, '550e8400-e29b-41d4-a716-446655440000')).status).toBe(
      'EXPIRED',
    );
    expect(updateMany).not.toHaveBeenCalled();
  });
  it('marks only stale open requests in the background job', async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    await new RequestExpiryService({
      bloodRequest: { updateMany },
    } as unknown as PrismaService).expire();
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: 'OPEN', expiresAt: { lte: expect.any(Date) } },
        data: { status: 'EXPIRED' },
      }),
    );
  });
});
