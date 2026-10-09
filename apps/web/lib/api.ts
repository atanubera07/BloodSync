export const API_URL = '/api/v1';
let pendingRefresh: Promise<boolean> | null = null;
function toast(message: string, type: 'success' | 'error') {
  if (typeof window !== 'undefined')
    window.dispatchEvent(new CustomEvent('bloodsync:toast', { detail: { message, type } }));
}
function mutationMessage(path: string, method: string) {
  if (path === '/auth/login') return 'Signed in. Welcome back.';
  if (path === '/auth/logout') return 'You have signed out.';
  if (path === '/auth/register') return 'Account created. Check your email to verify it.';
  if (path.includes('password/forgot')) return 'If an account exists, a reset link is on its way.';
  if (path.includes('verify-email/request'))
    return 'If an account needs verification, a link is on its way.';
  if (path.includes('verify-email')) return 'Email verified successfully.';
  if (path.includes('password/reset')) return 'Password updated. You can sign in.';
  if (path.includes('/approve')) return 'Donor approved.';
  if (path.includes('/reject')) return 'Donor rejected.';
  if (path.includes('/interests/')) return 'Your interest has been shared.';
  if (path.includes('/consent')) return 'Your consent choices were updated.';
  if (path.includes('/donors/me')) return 'Your donor profile was saved.';
  if (path.includes('/requests'))
    return method === 'POST' ? 'Blood request created.' : 'Request updated.';
  return 'Your changes were saved.';
}
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
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, options());
  } catch (error) {
    if (path !== '/auth/me') toast('Unable to connect. Please try again.', 'error');
    throw error;
  }
  if (response.status === 401 && (path === '/auth/me' || !path.startsWith('/auth/'))) {
    if (await refreshSession()) response = await fetch(`${API_URL}${path}`, options());
  }
  const method = (init.method || 'GET').toUpperCase();
  if (!['GET', 'HEAD'].includes(method)) {
    toast(
      response.ok
        ? mutationMessage(path, method)
        : 'Something went wrong. Please check the details and try again.',
      response.ok ? 'success' : 'error',
    );
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
    if ((!init.method || init.method.toUpperCase() === 'GET') && path !== '/auth/me')
      toast('Unable to load this information. Please try again.', 'error');
    throw new ApiError(
      typeof body.message === 'string' ? body.message : `Request failed (${response.status})`,
      response.status,
    );
  }
  return response.json() as Promise<T>;
}
export type Account = { id: string; fullName: string; email: string; role: 'USER' | 'ADMIN' };
