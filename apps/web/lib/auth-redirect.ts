const allowedDestination =
  /^\/(?:dashboard|account|admin|donor\/(?:profile|matches)|requests(?:\/(?:new|[0-9a-f-]{36}))?)(?:\?[^#]*)?$/i;

export function safeAuthDestination(value: string | null) {
  return value && allowedDestination.test(value) ? value : '/dashboard';
}
