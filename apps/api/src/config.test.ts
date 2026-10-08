import { describe, expect, it } from 'vitest';
import { readConfig } from './config';

const env = {
  NODE_ENV: 'production',
  VERCEL: '1',
  VERCEL_URL: 'bloodsync.example.vercel.app',
  DATABASE_URL: 'postgresql://synthetic:synthetic@localhost:5432/synthetic',
  SESSION_SECRET: 'synthetic-session-secret-longer-than-32-characters',
  SMTP_HOST: 'smtp.example.test',
  MAIL_FROM: 'BloodSync <test@example.test>',
  INTERNAL_JOB_SECRET: 'synthetic-internal-secret-longer-than-32-characters',
  CRON_SECRET: 'synthetic-cron-secret-longer-than-32-characters',
};

describe('Vercel production configuration', () => {
  it('derives the web origin from the deployment URL', () => {
    expect(readConfig(env).WEB_ORIGIN).toBe('https://bloodsync.example.vercel.app');
    expect(
      readConfig({ ...env, VERCEL_PROJECT_PRODUCTION_URL: 'bloodsync.vercel.app' }).WEB_ORIGIN,
    ).toBe('https://bloodsync.vercel.app');
  });

  it('requires internal job and cron secrets', () => {
    expect(() => readConfig({ ...env, INTERNAL_JOB_SECRET: undefined })).toThrow();
    expect(() => readConfig({ ...env, CRON_SECRET: undefined })).toThrow();
  });
});
