import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from './api';
afterEach(() => vi.unstubAllGlobals());
describe('browser session refresh', () => {
  it('refreshes once and retries an expired account read', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('{}', { status: 401 }))
      .mockResolvedValueOnce(new Response('{}', { status: 200 }))
      .mockResolvedValueOnce(new Response('{"id":"user"}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const response = await api('/auth/me');
    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toContain('/auth/refresh');
  });
});

describe('CSRF token after refresh', () => {
  it('rebuilds the token header before retrying a mutation', async () => {
    let cookie = `bs_csrf=${'a'.repeat(43)}`;
    vi.stubGlobal('document', {
      get cookie() {
        return cookie;
      },
    });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('{}', { status: 401 }))
      .mockImplementationOnce(async () => {
        cookie = `bs_csrf=${'b'.repeat(43)}`;
        return new Response('{}', { status: 200 });
      })
      .mockResolvedValueOnce(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    expect((await api('/me/consent', { method: 'DELETE' })).status).toBe(200);
    const first = fetchMock.mock.calls[0][1] as RequestInit;
    const retry = fetchMock.mock.calls[2][1] as RequestInit;
    expect(new Headers(first.headers).get('x-csrf-token')).toBe('a'.repeat(43));
    expect(new Headers(retry.headers).get('x-csrf-token')).toBe('b'.repeat(43));
  });
});
