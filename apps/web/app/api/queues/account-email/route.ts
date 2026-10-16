import { handleCallback } from '@vercel/queue';
import { z } from 'zod';

export const runtime = 'nodejs';

const messageSchema = z.strictObject({
  email: z.email().max(254),
  kind: z.enum(['VERIFY', 'RESET']),
});

const consume = async (message: unknown) => {
  const job = messageSchema.parse(message);
  const base = process.env.BLOODSYNC_API_INTERNAL_URL;
  const secret = process.env.INTERNAL_JOB_SECRET;
  if (!base || !secret) throw new Error('Account email consumer is not configured');
  const response = await fetch(new URL('/internal/account-email', base), {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-internal-job-secret': secret },
    body: JSON.stringify(job),
  });
  if (!response.ok) throw new Error(`Account email consumer failed (${response.status})`);
};

export async function POST(request: Request) {
  return handleCallback(consume)(request);
}
