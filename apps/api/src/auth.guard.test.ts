import { describe, expect, it } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { AdminGuard } from './auth.guard';
import type { AuthService } from './auth.service';
function context() {
  return {
    switchToHttp: () => ({ getRequest: () => ({ cookies: { bs_access: 'token' }, headers: {} }) }),
  } as ExecutionContext;
}
describe('admin guard', () => {
  it('denies a signed-in normal user', async () => {
    const auth = { verifyAccess: async () => ({ id: 'u', role: 'USER' }) } as AuthService;
    await expect(new AdminGuard(auth).canActivate(context())).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
  it('allows an admin', async () => {
    const auth = { verifyAccess: async () => ({ id: 'a', role: 'ADMIN' }) } as AuthService;
    await expect(new AdminGuard(auth).canActivate(context())).resolves.toBe(true);
  });
});
