import { BadRequestException, HttpException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { loginSchema, registerSchema } from '@bloodsync/shared';
import * as argon2 from 'argon2';
import { createHmac, createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { readConfig } from './config';
import { MailService } from './mail.service';

const ACCESS_MS = 15 * 60_000;
const REFRESH_MS = 7 * 24 * 60 * 60_000;
export const MAX_FAILED_LOGINS = 5;
export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
@Injectable()
export class AuthService {
  constructor(private readonly db: PrismaService, private readonly mail: MailService) {}
  async register(input: unknown) {
    const data = registerSchema.safeParse(input);
    if (!data.success) throw new BadRequestException('Invalid registration details');
    const exists = await this.db.user.findUnique({ where: { email: data.data.email }, select: { id: true } });
    if (exists) throw new BadRequestException('Unable to create account with these details');
    let user;
    try {
      user = await this.db.user.create({ data: { email: data.data.email, fullName: data.data.fullName, passwordHash: await argon2.hash(data.data.password, { type: argon2.argon2id }) }, select: { id: true, email: true, fullName: true, role: true } });
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') throw new BadRequestException('Unable to create account with these details');
      throw error;
    }
    await this.sendEmailToken(user.id, user.email, 'VERIFY');
    return user;
  }
  async login(input: unknown) {
    const data = loginSchema.safeParse(input);
    if (!data.success) throw new UnauthorizedException('Invalid email or password');
    const user = await this.db.user.findUnique({ where: { email: data.data.email.toLowerCase() } });
    if (!user) throw new UnauthorizedException('Invalid email or password');
    if (user.lockedUntil && user.lockedUntil > new Date()) throw new HttpException('Too many attempts. Try again later.', 429);
    if (user.lockedUntil && user.lockedUntil <= new Date()) {
      await this.db.user.update({ where: { id: user.id }, data: { failedLoginAttempts: 0, lockedUntil: null } });
      user.failedLoginAttempts = 0;
      user.lockedUntil = null;
    }
    if (!await argon2.verify(user.passwordHash, data.data.password)) {
      await this.db.$executeRaw`UPDATE "User" SET "failedLoginAttempts" = "failedLoginAttempts" + 1,
        "lockedUntil" = CASE WHEN "failedLoginAttempts" + 1 >= ${MAX_FAILED_LOGINS}
          THEN NOW() + INTERVAL '15 minutes' ELSE "lockedUntil" END
        WHERE "id" = ${user.id}::uuid`;
      throw new UnauthorizedException('Invalid email or password');
    }
    if (!user.emailVerifiedAt) throw new UnauthorizedException('Verify your email before signing in');
    if (user.failedLoginAttempts || user.lockedUntil) await this.db.user.update({ where: { id: user.id }, data: { failedLoginAttempts: 0, lockedUntil: null } });
    return this.issueSession(user.id);
  }
  private async sendEmailToken(userId: string, email: string, kind: 'VERIFY' | 'RESET') {
    const token = randomBytes(32).toString('base64url');
    await this.db.emailToken.create({ data: { userId, kind, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + (kind === 'VERIFY' ? 24 * 60 * 60_000 : 30 * 60_000)) } });
    await this.mail.sendAction(email, kind === 'VERIFY' ? 'verify' : 'reset', token);
  }
  async requestVerification(input: unknown) {
    const email = this.parseEmail(input);
    const user = await this.db.user.findUnique({ where: { email } });
    if (user && !user.emailVerifiedAt) await this.sendEmailToken(user.id, user.email, 'VERIFY');
    return { ok: true };
  }
  async verifyEmail(input: unknown) {
    const token = this.parseToken(input);
    const record = await this.db.emailToken.findUnique({ where: { tokenHash: hashToken(token) } });
    if (!record || record.kind !== 'VERIFY' || record.usedAt || record.expiresAt < new Date()) throw new BadRequestException('Invalid or expired link');
    await this.db.$transaction(async tx => {
      const claimed = await tx.emailToken.updateMany({ where: { id: record.id, usedAt: null }, data: { usedAt: new Date() } });
      if (claimed.count !== 1) throw new BadRequestException('Invalid or expired link');
      await tx.user.update({ where: { id: record.userId }, data: { emailVerifiedAt: new Date() } });
    });
    return { ok: true };
  }
  async requestPasswordReset(input: unknown) {
    const email = this.parseEmail(input);
    const user = await this.db.user.findUnique({ where: { email } });
    if (user) await this.sendEmailToken(user.id, user.email, 'RESET');
    return { ok: true };
  }
  async resetPassword(input: unknown) {
    if (!input || typeof input !== 'object') throw new BadRequestException('Invalid reset details');
    const { token, password } = input as Record<string, unknown>;
    const parsedToken = this.parseToken({ token });
    if (typeof password !== 'string' || password.length < 12 || password.length > 128) throw new BadRequestException('Invalid reset details');
    const record = await this.db.emailToken.findUnique({ where: { tokenHash: hashToken(parsedToken) } });
    if (!record || record.kind !== 'RESET' || record.usedAt || record.expiresAt < new Date()) throw new BadRequestException('Invalid or expired link');
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    await this.db.$transaction(async tx => {
      const claimed = await tx.emailToken.updateMany({ where: { id: record.id, usedAt: null }, data: { usedAt: new Date() } });
      if (claimed.count !== 1) throw new BadRequestException('Invalid or expired link');
      await tx.user.update({ where: { id: record.userId }, data: { passwordHash, failedLoginAttempts: 0, lockedUntil: null } });
      await tx.session.updateMany({ where: { userId: record.userId, revokedAt: null }, data: { revokedAt: new Date() } });
    });
    return { ok: true };
  }
  private parseEmail(input: unknown) {
    if (!input || typeof input !== 'object' || typeof (input as Record<string, unknown>).email !== 'string') throw new BadRequestException('Invalid email');
    const email = (input as { email: string }).email.trim().toLowerCase();
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new BadRequestException('Invalid email');
    return email;
  }
  private parseToken(input: unknown) {
    const token = input && typeof input === 'object' ? (input as Record<string, unknown>).token : undefined;
    if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token)) throw new BadRequestException('Invalid link');
    return token;
  }
  private sign(payload: string) { return createHmac('sha256', readConfig().SESSION_SECRET).update(payload).digest('base64url'); }
  private accessToken(userId: string, sessionId: string) {
    const payload = Buffer.from(JSON.stringify({ sub: userId, sid: sessionId, exp: Date.now() + ACCESS_MS })).toString('base64url');
    return `${payload}.${this.sign(payload)}`;
  }
  async issueSession(userId: string) {
    const refresh = randomBytes(32).toString('base64url');
    const session = await this.db.session.create({ data: { userId, tokenHash: hashToken(refresh), expiresAt: new Date(Date.now() + REFRESH_MS) } });
    return { access: this.accessToken(userId, session.id), refresh };
  }
  async verifyAccess(token?: string) {
    if (!token) throw new UnauthorizedException();
    const [payload, sig] = token.split('.');
    if (!payload || !sig) throw new UnauthorizedException();
    const expected = Buffer.from(this.sign(payload));
    const actual = Buffer.from(sig);
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new UnauthorizedException();
    let decoded: { sub?: string; sid?: string; exp?: number };
    try { decoded = JSON.parse(Buffer.from(payload, 'base64url').toString()); } catch { throw new UnauthorizedException(); }
    if (!decoded.sub || !decoded.sid || !decoded.exp || decoded.exp < Date.now()) throw new UnauthorizedException();
    const session = await this.db.session.findUnique({ where: { id: decoded.sid }, include: { user: true } });
    if (!session || session.userId !== decoded.sub || session.revokedAt || session.expiresAt < new Date()) throw new UnauthorizedException();
    return { id: session.user.id, role: session.user.role, fullName: session.user.fullName, email: session.user.email };
  }
  async refresh(token?: string) {
    if (!token) throw new UnauthorizedException();
    const old = await this.db.session.findUnique({ where: { tokenHash: hashToken(token) } });
    if (!old || old.revokedAt || old.expiresAt < new Date()) throw new UnauthorizedException();
    const claimed = await this.db.session.updateMany({ where: { id: old.id, revokedAt: null }, data: { revokedAt: new Date() } });
    if (claimed.count !== 1) throw new UnauthorizedException();
    return this.issueSession(old.userId);
  }
  async logout(token?: string) {
    if (token) await this.db.session.updateMany({ where: { tokenHash: hashToken(token), revokedAt: null }, data: { revokedAt: new Date() } });
  }
}
