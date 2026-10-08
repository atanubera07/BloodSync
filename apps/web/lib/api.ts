export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
let pendingRefresh: Promise<boolean> | null = null;
async function refreshSession() {
  pendingRefresh ??= fetch(`${API_URL}/auth/refresh`, { method: 'POST', credentials: 'include' }).then(response => response.ok).catch(() => false).finally(() => { pendingRefresh = null; });
  return pendingRefresh;
}
export async function api(path: string, init: RequestInit = {}) {
  const options: RequestInit = { ...init, credentials: 'include', headers: { ...(init.body ? { 'content-type': 'application/json' } : {}), ...init.headers } };
  let response = await fetch(`${API_URL}${path}`, options);
  if (response.status === 401 && (path === '/auth/me' || !path.startsWith('/auth/'))) {
    if (await refreshSession()) response = await fetch(`${API_URL}${path}`, options);
  }
  return response;
}
export async function apiJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await api(path, init);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(typeof body.message === 'string' ? body.message : `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}
export type Account = { id: string; fullName: string; email: string; role: 'USER' | 'ADMIN' };
