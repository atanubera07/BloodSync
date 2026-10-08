import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from './api';
afterEach(() => vi.unstubAllGlobals());
describe('browser session refresh', () => {
  it('refreshes once and retries an expired account read', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response('{}', { status: 401 }))
      .mockResolvedValueOnce(new Response('{}', { status: 200 }))
      .mockResolvedValueOnce(new Response('{"id":"user"}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const response = await api('/auth/me');
    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toContain('/auth/refresh');
  });
});
