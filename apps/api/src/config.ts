import { Injectable } from '@nestjs/common';
import { z } from 'zod';
const configSchema = z.object({
  REDIS_URL: z.url().default('redis://localhost:6379'),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(3).default(0),
  DATABASE_URL: z.string().startsWith('postgresql://'),
  WEB_ORIGIN: z.url(),
  SESSION_SECRET: z.string().min(32),
  SMTP_HOST: z.string().min(1).default('localhost'),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(1025),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().min(3).default('BloodSync <no-reply@localhost>'),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  VERCEL: z.string().optional(),
  INTERNAL_JOB_SECRET: z.string().min(32).optional(),
  CRON_SECRET: z.string().min(32).optional(),
});
export function readConfig(env: NodeJS.ProcessEnv = process.env) {
  const effectiveEnv = {
    ...env,
    WEB_ORIGIN:
      env.WEB_ORIGIN ||
      (env.VERCEL && env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`
        : env.VERCEL && env.VERCEL_URL
          ? `https://${env.VERCEL_URL}`
          : undefined),
  };
  const result = configSchema.safeParse(effectiveEnv);
  if (!result.success)
    throw new Error(
      'Invalid server environment: ' + result.error.issues.map((i) => i.path.join('.')).join(', '),
    );
  if (
    result.data.NODE_ENV === 'production' &&
    (!result.data.WEB_ORIGIN.startsWith('https://') ||
      result.data.SESSION_SECRET.includes('replace-with') ||
      !env.SMTP_HOST ||
      env.SMTP_HOST === 'localhost' ||
      !env.MAIL_FROM ||
      env.MAIL_FROM.includes('@localhost') ||
      (result.data.VERCEL && (!result.data.INTERNAL_JOB_SECRET || !result.data.CRON_SECRET)))
  )
    throw new Error('Invalid production server environment');
  return result.data;
}

export type AppConfig = ReturnType<typeof readConfig>;

@Injectable()
export class ConfigService {
  readonly values: AppConfig;
  constructor() {
    this.values = readConfig();
  }
}
