import { describe, expect, it, vi } from 'vitest';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { AdminGuard, AuthGuard } from './auth.guard';
import type { AuthService } from './auth.service';
function context(cookies: Record<string, string> = {}, authorization?: string) {
  return {
    switchToHttp: () => ({ getRequest: () => ({ cookies, headers: { authorization } }) }),
  } as ExecutionContext;
}
const normal = { id: 'u', role: 'USER' };
describe('auth guards', () => {
  it('rejects a missing token without invoking verification', async () => {
    const verifyAccess = vi.fn();
    await expect(
      new AuthGuard({ verifyAccess } as unknown as AuthService).canActivate(context()),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(verifyAccess).not.toHaveBeenCalled();
  });
  it.each(['malformed', 'expired'])('rejects a %s token', async (token) => {
    const auth = {
      verifyAccess: vi.fn().mockRejectedValue(new Error(token)),
    } as unknown as AuthService;
    await expect(
      new AuthGuard(auth).canActivate(context({ bs_access: token })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
  it('accepts a valid Bearer token and stores the user', async () => {
    const auth = { verifyAccess: vi.fn().mockResolvedValue(normal) } as unknown as AuthService;
    await expect(new AuthGuard(auth).canActivate(context({}, 'Bearer valid'))).resolves.toBe(true);
    expect(auth.verifyAccess).toHaveBeenCalledWith('valid');
  });
  it('rejects a non-admin from an admin route', async () => {
    const auth = { verifyAccess: vi.fn().mockResolvedValue(normal) } as unknown as AuthService;
    await expect(
      new AdminGuard(auth).canActivate(context({ bs_access: 'token' })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
  it('accepts an admin', async () => {
    const auth = {
      verifyAccess: vi.fn().mockResolvedValue({ id: 'a', role: 'ADMIN' }),
    } as unknown as AuthService;
    await expect(new AdminGuard(auth).canActivate(context({ bs_access: 'token' }))).resolves.toBe(
      true,
    );
  });
});
