import { describe, expect, it, vi } from 'vitest';
import { RequestService } from './request.service';
import type { PrismaService } from './prisma.service';
import type { MatchingService } from './matching.service';
const actor = { id: '550e8400-e29b-41d4-a716-446655440000', role: 'USER' as const, email: 'user@example.test', fullName: 'Test User' };
describe('request expiry', () => {
  it('marks stale owned requests expired before listing them', async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    const findMany = vi.fn().mockResolvedValue([]);
    const service = new RequestService({ bloodRequest: { updateMany, findMany } } as unknown as PrismaService, {} as MatchingService);
    await service.listOwn(actor);
    expect(updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ ownerId: actor.id, status: 'OPEN' }), data: { status: 'EXPIRED' } }));
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { ownerId: actor.id } }));
  });
});
