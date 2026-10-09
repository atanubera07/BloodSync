import { z } from 'zod';
import { bloodGroupSchema } from './mvp';
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
  phoneNumber: z
    .string()
    .trim()
    .regex(/^\+?[0-9][0-9\s().-]{6,23}$/)
    .optional(),
  declaredBloodGroup: bloodGroupSchema.optional(),
  postalAddress: z.string().trim().max(250).optional(),
  city: z.string().trim().max(100).optional(),
  stateRegion: z.string().trim().max(100).optional(),
  acceptTerms: z.literal(true),
});
export const loginSchema = z.strictObject({ email: z.email(), password: z.string() });
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
