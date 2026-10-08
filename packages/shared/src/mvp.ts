import { z } from 'zod';

export const bloodGroups = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'] as const;
export const bloodGroupSchema = z.enum(bloodGroups);
export type BloodGroup = z.infer<typeof bloodGroupSchema>;

/** Red-cell compatibility for matching only; a clinical team must verify every transfusion. */
const donorsForRecipient: Record<BloodGroup, readonly BloodGroup[]> = {
  'O-': ['O-'],
  'O+': ['O-', 'O+'],
  'A-': ['O-', 'A-'],
  'A+': ['O-', 'O+', 'A-', 'A+'],
  'B-': ['O-', 'B-'],
  'B+': ['O-', 'O+', 'B-', 'B+'],
  'AB-': ['O-', 'A-', 'B-', 'AB-'],
  'AB+': bloodGroups,
};
export const compatibleDonorGroups = (recipient: BloodGroup) => donorsForRecipient[recipient];
export const compatibleRecipientGroups = (donor: BloodGroup) =>
  bloodGroups.filter((group) => donorsForRecipient[group].includes(donor));

const locationFields = {
  city: z.string().trim().min(2).max(100),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
};
export const donorProfileSchema = z
  .strictObject({
    bloodGroup: bloodGroupSchema,
    birthDate: z.iso.date(),
    weightKg: z.number().min(1).max(300),
    lastDonationAt: z.iso.date().nullable().optional(),
    consentToMatch: z.boolean(),
    ...locationFields,
  })
  .refine((v) => (v.latitude == null) === (v.longitude == null), {
    message: 'Provide both latitude and longitude',
    path: ['latitude'],
  });

const requestBaseSchema = z.strictObject({
  bloodGroup: bloodGroupSchema,
  units: z.number().int().min(1).max(20),
  urgency: z.enum(['NORMAL', 'URGENT']),
  hospitalName: z.string().trim().min(2).max(120),
  expiresAt: z.iso.datetime({ offset: true }),
  ...locationFields,
});
export const requestSchema = requestBaseSchema.refine(
  (v) => (v.latitude == null) === (v.longitude == null),
  { message: 'Provide both latitude and longitude', path: ['latitude'] },
);
export const requestUpdateSchema = requestBaseSchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: 'No changes provided' })
  .refine(
    (v) =>
      (v.latitude === undefined && v.longitude === undefined) ||
      (v.latitude !== undefined &&
        v.longitude !== undefined &&
        (v.latitude == null) === (v.longitude == null)),
    { message: 'Provide both latitude and longitude' },
  );

export type DonorProfileInput = z.infer<typeof donorProfileSchema>;
export type BloodRequestInput = z.infer<typeof requestSchema>;
