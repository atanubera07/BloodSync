import { z } from 'zod';
export * from './eligibility';
export const registerSchema = z.strictObject({
  email: z.email().max(254).transform(v => v.toLowerCase()),
  password: z.string().min(12).max(128),
  fullName: z.string().trim().min(2).max(100),
});
export const loginSchema = z.strictObject({ email: z.email(), password: z.string() });
export type RegisterInput = z.infer<typeof registerSchema>;
