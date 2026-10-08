import { describe, expect, it } from 'vitest';
import { compatibleDonorGroups, compatibleRecipientGroups, donorProfileSchema, requestSchema } from './mvp';
describe('red-cell matching guidance', () => {
  it('restricts O-negative recipients and allows O-negative donors across groups', () => {
    expect(compatibleDonorGroups('O-')).toEqual(['O-']);
    expect(compatibleRecipientGroups('O-')).toHaveLength(8);
  });
  it('includes all groups for AB-positive recipients', () => expect(compatibleDonorGroups('AB+')).toHaveLength(8));
});
describe('server contracts', () => {
  it('rejects a donor profile with only one coordinate', () => {
    expect(donorProfileSchema.safeParse({ bloodGroup: 'O+', birthDate: '1995-01-01', weightKg: 50, city: 'Kolkata', latitude: 22.57, consentToMatch: true }).success).toBe(false);
  });
  it('rejects client-supplied request ownership', () => {
    expect(requestSchema.safeParse({ bloodGroup: 'O+', units: 1, urgency: 'NORMAL', hospitalName: 'City Hospital', city: 'Kolkata', expiresAt: '2026-12-01T00:00:00Z', ownerId: 'another-user' }).success).toBe(false);
  });
});
