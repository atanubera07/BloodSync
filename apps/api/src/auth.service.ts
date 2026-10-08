import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import {
  loginSchema,
  registerSchema,
  passwordSchema,
  emailInputSchema,
  tokenInputSchema,
  resetPasswordSchema,
} from '@bloodsync/shared';
import type { z } from 'zod';
import { hashPassword, verifyPassword } from './password';
import { createHmac, createHash, hkdfSync, randomBytes, timingSafeEqual } from 'node:crypto';
import { ConfigService, readConfig } from './config';
import { MailService } from './mail.service';
import { ApiLogger } from './logger';

const ACCESS_MS = 15 * 60_000;
const REFRESH_MS = 7 * 24 * 60 * 60_000;
export const MAX_FAILED_LOGINS = 5;
export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
const dummyHash = hashPassword('not-a-real-account-password');
export const derivedKey = (secret: string, purpose: string) =>
  Buffer.from(hkdfSync('sha256', secret, 'BloodSync v1', purpose, 32));
@Injectable()
export class AuthService {
  constructor(
    private readonly db: PrismaService,
    private readonly mail: MailService,
    private readonly config?: ConfigService,
  ) {}
  async register(input: z.infer<typeof registerSchema>) {
    const data = registerSchema.safeParse(input);
    if (!data.success) throw new BadRequestException('Invalid registration details');
    const exists = await this.db.user.findUnique({
      where: { email: data.data.email },
      select: { id: true },
    });
    if (exists) throw new BadRequestException('Unable to create account with these details');
    let user;
    try {
      user = await this.db.user.create({
        data: {
          email: data.data.email,
          fullName: data.data.fullName,
          passwordHash: await hashPassword(data.data.password),
        },
        select: { id: true, email: true, fullName: true, role: true },
      });
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002')
        throw new BadRequestException('Unable to create account with these details');
      throw error;
    }
    try {
      await this.mail.enqueue(user.email, 'VERIFY');
    } catch {
      new ApiLogger().warn(
        'Verification email could not be queued after registration; resend is available',
      );
    }
    return user;
  }
  async login(input: z.infer<typeof loginSchema>) {
    const data = loginSchema.safeParse(input);
    if (!data.success) throw new UnauthorizedException('Invalid email or password');
    const user = await this.db.user.findUnique({ where: { email: data.data.email.toLowerCase() } });
    if (!user) {
      await verifyPassword(await dummyHash, data.data.password);
      throw new UnauthorizedException('Invalid email or password');
    }
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      await verifyPassword(await dummyHash, data.data.password);
      throw new UnauthorizedException('Invalid email or password');
    }
    if (user.lockedUntil && user.lockedUntil <= new Date()) {
      await this.db.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
      user.failedLoginAttempts = 0;
      user.lockedUntil = null;
    }
    if (!(await verifyPassword(user.passwordHash, data.data.password))) {
      await this.db.$executeRaw`UPDATE "User" SET "failedLoginAttempts" = "failedLoginAttempts" + 1,
        "lockedUntil" = CASE WHEN "failedLoginAttempts" + 1 >= ${MAX_FAILED_LOGINS}
          THEN NOW() + INTERVAL '15 minutes' ELSE "lockedUntil" END
        WHERE "id" = ${user.id}::uuid`;
      throw new UnauthorizedException('Invalid email or password');
    }
    if (!user.emailVerifiedAt)
      throw new UnauthorizedException('Verify your email before signing in');
    if (user.failedLoginAttempts || user.lockedUntil)
      await this.db.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
    return this.issueSession(user.id);
  }
  async requestVerification(input: z.infer<typeof emailInputSchema>) {
    const email = this.parseEmail(input);
    await this.mail.enqueue(email, 'VERIFY');
    return { ok: true };
  }
  async verifyEmail(input: z.infer<typeof tokenInputSchema>) {
    const token = this.parseToken(input);
    const record = await this.db.emailToken.findUnique({ where: { tokenHash: hashToken(token) } });
    if (!record || record.kind !== 'VERIFY' || record.usedAt || record.expiresAt < new Date())
      throw new BadRequestException('Invalid or expired link');
    await this.db.$transaction(async (tx) => {
      const claimed = await tx.emailToken.updateMany({
        where: { id: record.id, usedAt: null },
        data: { usedAt: new Date() },
      });
      if (claimed.count !== 1) throw new BadRequestException('Invalid or expired link');
      await tx.user.update({ where: { id: record.userId }, data: { emailVerifiedAt: new Date() } });
    });
    return { ok: true };
  }
  async requestPasswordReset(input: z.infer<typeof emailInputSchema>) {
    const email = this.parseEmail(input);
    await this.mail.enqueue(email, 'RESET');
    return { ok: true };
  }
  async resetPassword(input: z.infer<typeof resetPasswordSchema>) {
    if (!input || typeof input !== 'object') throw new BadRequestException('Invalid reset details');
    const { token, password } = input as Record<string, unknown>;
    const parsedToken = this.parseToken({ token });
    if (!passwordSchema.safeParse(password).success)
      throw new BadRequestException('Invalid reset details');
    const record = await this.db.emailToken.findUnique({
      where: { tokenHash: hashToken(parsedToken) },
    });
    if (!record || record.kind !== 'RESET' || record.usedAt || record.expiresAt < new Date())
      throw new BadRequestException('Invalid or expired link');
    const passwordHash = await hashPassword(password as string);
    await this.db.$transaction(async (tx) => {
      const claimed = await tx.emailToken.updateMany({
        where: { id: record.id, usedAt: null },
        data: { usedAt: new Date() },
      });
      if (claimed.count !== 1) throw new BadRequestException('Invalid or expired link');
      await tx.user.update({
        where: { id: record.userId },
        data: { passwordHash, failedLoginAttempts: 0, lockedUntil: null },
      });
      await tx.session.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });
    return { ok: true };
  }
  private parseEmail(input: unknown) {
    if (
      !input ||
      typeof input !== 'object' ||
      typeof (input as Record<string, unknown>).email !== 'string'
    )
      throw new BadRequestException('Invalid email');
    const email = (input as { email: string }).email.trim().toLowerCase();
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new BadRequestException('Invalid email');
    return email;
  }
  private parseToken(input: unknown) {
    const token =
      input && typeof input === 'object' ? (input as Record<string, unknown>).token : undefined;
    if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token))
      throw new BadRequestException('Invalid link');
    return token;
  }
  private sign(payload: string) {
    return createHmac(
      'sha256',
      derivedKey((this.config?.values ?? readConfig()).SESSION_SECRET, 'access-token'),
    )
      .update(payload)
      .digest('base64url');
  }
  private accessToken(userId: string, sessionId: string) {
    const payload = Buffer.from(
      JSON.stringify({ sub: userId, sid: sessionId, exp: Date.now() + ACCESS_MS }),
    ).toString('base64url');
    return `${payload}.${this.sign(payload)}`;
  }
  async issueSession(userId: string) {
    const refresh = randomBytes(32).toString('base64url');
    const session = await this.db.session.create({
      data: { userId, tokenHash: hashToken(refresh), expiresAt: new Date(Date.now() + REFRESH_MS) },
    });
    return { access: this.accessToken(userId, session.id), refresh };
  }
  async verifyAccess(token?: string) {
    if (!token) throw new UnauthorizedException();
    const [payload, sig] = token.split('.');
    if (!payload || !sig) throw new UnauthorizedException();
    const expected = Buffer.from(this.sign(payload));
    const actual = Buffer.from(sig);
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
      throw new UnauthorizedException();
    let decoded: { sub?: string; sid?: string; exp?: number };
    try {
      decoded = JSON.parse(Buffer.from(payload, 'base64url').toString());
    } catch {
      throw new UnauthorizedException();
    }
    if (!decoded.sub || !decoded.sid || !decoded.exp || decoded.exp < Date.now())
      throw new UnauthorizedException();
    const session = await this.db.session.findUnique({
      where: { id: decoded.sid },
      include: { user: { select: { id: true, role: true, fullName: true, email: true } } },
    });
    if (
      !session ||
      session.userId !== decoded.sub ||
      session.revokedAt ||
      session.expiresAt < new Date()
    )
      throw new UnauthorizedException();
    return {
      id: session.user.id,
      role: session.user.role,
      fullName: session.user.fullName,
      email: session.user.email,
    };
  }
  async refresh(token?: string) {
    if (!token) throw new UnauthorizedException();
    const old = await this.db.session.findUnique({ where: { tokenHash: hashToken(token) } });
    if (!old || old.revokedAt || old.expiresAt < new Date()) throw new UnauthorizedException();
    const refresh = randomBytes(32).toString('base64url');
    const session = await this.db.$transaction(async (tx) => {
      const claimed = await tx.session.updateMany({
        where: { id: old.id, revokedAt: null, expiresAt: { gt: new Date() } },
        data: { revokedAt: new Date() },
      });
      if (claimed.count !== 1) throw new UnauthorizedException();
      return tx.session.create({
        data: {
          userId: old.userId,
          tokenHash: hashToken(refresh),
          expiresAt: new Date(Date.now() + REFRESH_MS),
        },
      });
    });
    return { access: this.accessToken(old.userId, session.id), refresh };
  }
  async logout(token?: string) {
    if (token)
      await this.db.session.updateMany({
        where: { tokenHash: hashToken(token), revokedAt: null },
        data: { revokedAt: new Date() },
      });
  }
}
