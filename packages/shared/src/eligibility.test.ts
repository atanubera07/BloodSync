import { describe, expect, it } from 'vitest';
import { assessDonorEligibility, DONOR_ELIGIBILITY } from './eligibility';
describe('donor screening defaults', () => {
  it('accepts a candidate at the minimum weight with sufficient gap', () => {
    expect(
      assessDonorEligibility(
        {
          birthDate: new Date('2000-01-01'),
          weightKg: DONOR_ELIGIBILITY.minimumWeightKg,
          lastDonationAt: new Date('2025-01-01'),
        },
        new Date('2026-01-01'),
      ),
    ).toEqual([]);
  });
  it('rejects a recent donation', () => {
    expect(
      assessDonorEligibility(
        { birthDate: new Date('2000-01-01'), weightKg: 50, lastDonationAt: new Date('2026-01-01') },
        new Date('2026-02-01'),
      ),
    ).toContain('Donation gap is too short');
  });
});
