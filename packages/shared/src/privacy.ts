import { z } from 'zod';

export const PRIVACY_VERSION = '2026-10-08';
export const consentSchema = z.strictObject({
  privacyVersion: z.literal(PRIVACY_VERSION),
  healthProcessing: z.literal(true),
  contactSharing: z.boolean(),
});
