export const API_URL = '/api/v1';
let pendingRefresh: Promise<boolean> | null = null;
function csrfToken() {
  if (typeof document === 'undefined') return undefined;
  return document.cookie
    .split('; ')
    .find((part) => part.startsWith('bs_csrf='))
    ?.slice(8);
}
function mutationHeaders(method?: string): Record<string, string> {
  const token = csrfToken();
  return method && !['GET', 'HEAD'].includes(method.toUpperCase()) && token
    ? { 'x-csrf-token': token }
    : {};
}
async function refreshSession() {
  pendingRefresh ??= fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: mutationHeaders('POST'),
  })
    .then((response) => response.ok)
    .catch(() => false)
    .finally(() => {
      pendingRefresh = null;
    });
  return pendingRefresh;
}
export async function api(path: string, init: RequestInit = {}) {
  function options(): RequestInit {
    const headers = new Headers(init.headers);
    if (init.body) headers.set('content-type', 'application/json');
    for (const [key, value] of Object.entries(mutationHeaders(init.method)))
      headers.set(key, value);
    return { ...init, credentials: 'include', headers };
  }
  let response = await fetch(`${API_URL}${path}`, options());
  if (response.status === 401 && (path === '/auth/me' || !path.startsWith('/auth/'))) {
    if (await refreshSession()) response = await fetch(`${API_URL}${path}`, options());
  }
  return response;
}
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}
export async function apiJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await api(path, init);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(
      typeof body.message === 'string' ? body.message : `Request failed (${response.status})`,
      response.status,
    );
  }
  return response.json() as Promise<T>;
}
export type Account = { id: string; fullName: string; email: string; role: 'USER' | 'ADMIN' };
