import { z } from 'zod';
export * from './eligibility';
export * from './privacy';
export const passwordSchema = z.string().min(12).max(128);
export const registerSchema = z.strictObject({
  email: z
    .email()
    .max(254)
    .transform((v) => v.toLowerCase()),
  password: passwordSchema,
  fullName: z.string().trim().min(2).max(100),
});
export const loginSchema = z.strictObject({
  email: z
    .email()
    .max(254)
    .transform((v) => v.toLowerCase()),
  password: z.string(),
});
export const emailInputSchema = z.strictObject({ email: z.email().max(254).toLowerCase() });
export const tokenInputSchema = z.strictObject({ token: z.string().regex(/^[A-Za-z0-9_-]{43}$/) });
export const resetPasswordSchema = z.strictObject({
  token: tokenInputSchema.shape.token,
  password: passwordSchema,
});
export const deleteAccountSchema = z.strictObject({ password: z.string().min(1) });
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export * from './mvp';
