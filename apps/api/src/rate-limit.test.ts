import { describe, expect, it, vi } from 'vitest';
import { rateLimit } from './rate-limit';
import type Redis from 'ioredis';
import type { Request, Response, NextFunction } from 'express';
describe('shared Redis limiter', () => {
  it('enforces one bucket across two API middleware instances with Retry-After', async () => {
    const counts = new Map<string, number>();
    const redis = {
      eval: vi.fn(async (_script: string, _keys: number, key: string) => {
        const count = (counts.get(key) || 0) + 1;
        counts.set(key, count);
        return [count, 60];
      }),
    } as unknown as Redis;
    const one = rateLimit(redis);
    const two = rateLimit(redis);
    const req = {
      method: 'POST',
      path: '/v1/auth/register',
      ip: '192.0.2.1',
      socket: {},
    } as Request;
    const headers: Record<string, string> = {};
    const status = vi.fn().mockReturnThis();
    const json = vi.fn();
    const res = {
      setHeader: (key: string, value: string) => {
        headers[key] = value;
      },
      status,
      json,
    } as unknown as Response;
    const next = vi.fn() as NextFunction;
    for (let index = 0; index < 10; index++) await (index % 2 ? two : one)(req, res, next);
    expect(next).toHaveBeenCalledTimes(10);
    await two(req, res, next);
    expect(status).toHaveBeenCalledWith(429);
    expect(headers['Retry-After']).toBe('60');
  });
  it.each([
    ['GET', '/v1/me/export', 5],
    ['DELETE', '/v1/me', 3],
  ])('limits %s %s', async (method, path, limit) => {
    let count = 0;
    const redis = { eval: vi.fn(async () => [++count, 60]) } as unknown as Redis;
    const next = vi.fn();
    const status = vi.fn().mockReturnThis();
    const res = { status, json: vi.fn(), setHeader: vi.fn() } as unknown as Response;
    const req = { method, path, ip: '192.0.2.2', socket: {} } as Request;
    for (let n = 0; n < Number(limit); n++) await rateLimit(redis)(req, res, next);
    expect(next).toHaveBeenCalledTimes(Number(limit));
    await rateLimit(redis)(req, res, next);
    expect(status).toHaveBeenCalledWith(429);
  });
});
