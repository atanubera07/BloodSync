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
    ['GET', '/api/v1/me/export', 5],
    ['DELETE', '/api/v1/me', 3],
    ['PATCH', '/v1/me/details', 20],
    ['PUT', '/v1/donors/me', 12],
    ['POST', '/v1/requests', 30],
    ['PATCH', '/v1/requests/123', 30],
    ['DELETE', '/v1/requests/123', 30],
    ['POST', '/v1/admin/donors/123/approve', 30],
    ['POST', '/v1/admin/donors/123/reject', 30],
    ['POST', '/v1/cron/unknown', 60],
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
  it('enforces a user bucket across different IP addresses', async () => {
    const counts = new Map<string, number>();
    const redis = {
      eval: vi.fn(async (_script: string, _keys: number, key: string) => {
        const count = (counts.get(key) || 0) + 1;
        counts.set(key, count);
        return [count, 60];
      }),
    } as unknown as Redis;
    const identify = vi.fn(async () => 'user-1');
    const limiter = rateLimit(redis, identify);
    const next = vi.fn();
    const status = vi.fn().mockReturnThis();
    const res = { status, json: vi.fn(), setHeader: vi.fn() } as unknown as Response;
    for (let n = 0; n < 13; n++) {
      const req = {
        method: 'PUT',
        path: '/v1/donors/me',
        ip: `192.0.2.${n + 1}`,
        socket: {},
      } as Request;
      await limiter(req, res, next);
    }
    expect(next).toHaveBeenCalledTimes(12);
    expect(status).toHaveBeenCalledWith(429);
    expect(identify).toHaveBeenCalledTimes(13);
  });
  it.each([
    ['/v1/auth/login', 'email', 20],
    ['/api/v1/auth/password/reset', 'token', 5],
  ])('keeps an aggregate IP limit on %s when identities change', async (path, field, limit) => {
    const counts = new Map<string, number>();
    const redis = {
      eval: vi.fn(async (_script: string, _keys: number, key: string) => {
        const count = (counts.get(key) || 0) + 1;
        counts.set(key, count);
        return [count, 60];
      }),
    } as unknown as Redis;
    const limiter = rateLimit(redis);
    const next = vi.fn();
    const status = vi.fn().mockReturnThis();
    const res = { status, json: vi.fn(), setHeader: vi.fn() } as unknown as Response;
    for (let index = 0; index <= Number(limit); index++) {
      await limiter(
        {
          method: 'POST',
          path,
          ip: '192.0.2.1',
          socket: {},
          body: { [field]: `synthetic-${index}@example.test` },
        } as Request,
        res,
        next,
      );
    }
    expect(next).toHaveBeenCalledTimes(Number(limit));
    expect(status).toHaveBeenCalledWith(429);
  });

  it('limits a target email across IP addresses and casing changes', async () => {
    const counts = new Map<string, number>();
    const redis = {
      eval: vi.fn(async (_script: string, _keys: number, key: string) => {
        const count = (counts.get(key) || 0) + 1;
        counts.set(key, count);
        return [count, 60];
      }),
    } as unknown as Redis;
    const limiter = rateLimit(redis);
    const next = vi.fn();
    const status = vi.fn().mockReturnThis();
    const res = { status, json: vi.fn(), setHeader: vi.fn() } as unknown as Response;
    for (let index = 0; index < 6; index++) {
      await limiter(
        {
          method: 'POST',
          path: '/v1/auth/password/forgot',
          ip: `192.0.2.${index + 1}`,
          socket: {},
          body: { email: index % 2 ? 'SYNTHETIC@example.test' : 'synthetic@example.test' },
        } as Request,
        res,
        next,
      );
    }
    expect(next).toHaveBeenCalledTimes(5);
    expect(status).toHaveBeenCalledWith(429);
  });
});
