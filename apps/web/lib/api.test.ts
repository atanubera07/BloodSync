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

describe('mutation feedback', () => {
  it('reports a connection failure when the retry after refresh fails', async () => {
    const dispatchEvent = vi.fn();
    vi.stubGlobal('window', { dispatchEvent });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('{}', { status: 401 }))
      .mockResolvedValueOnce(new Response('{}', { status: 200 }))
      .mockRejectedValueOnce(new TypeError('Network unavailable'));
    vi.stubGlobal('fetch', fetchMock);

    await expect(api('/requests', { method: 'POST' })).rejects.toThrow('Network unavailable');
    expect(dispatchEvent).toHaveBeenCalledOnce();
    expect(dispatchEvent.mock.calls[0][0].detail).toEqual({
      message: 'Unable to connect. Please try again.',
      type: 'error',
    });
  });

  it.each([
    ['/requests/synthetic-id', 'Request closed.'],
    ['/me', 'Your account was deleted.'],
  ])('describes the completed deletion for %s', async (path, message) => {
    const dispatchEvent = vi.fn();
    vi.stubGlobal('window', { dispatchEvent });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 200 })));

    await api(path, { method: 'DELETE' });
    expect(dispatchEvent.mock.calls[0][0].detail).toEqual({ message, type: 'success' });
  });
});
