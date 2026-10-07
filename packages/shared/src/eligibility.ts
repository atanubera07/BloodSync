/** Screening defaults, subject to approval by qualified local clinicians. */
export const DONOR_ELIGIBILITY = Object.freeze({
  minimumAgeYears: 18,
  maximumAgeYears: 65,
  minimumWeightKg: 45,
  minimumDaysSinceDonation: 90,
});

export type EligibilityInput = { birthDate: Date; weightKg: number; lastDonationAt?: Date | null };

export function assessDonorEligibility(input: EligibilityInput, now = new Date()): string[] {
  const reasons: string[] = [];
  const age = now.getUTCFullYear() - input.birthDate.getUTCFullYear() -
    (now.getUTCMonth() < input.birthDate.getUTCMonth() ||
      (now.getUTCMonth() === input.birthDate.getUTCMonth() && now.getUTCDate() < input.birthDate.getUTCDate()) ? 1 : 0);
  if (!Number.isFinite(age) || age < DONOR_ELIGIBILITY.minimumAgeYears || age > DONOR_ELIGIBILITY.maximumAgeYears) reasons.push('Age is outside the screening range');
  if (!Number.isFinite(input.weightKg) || input.weightKg < DONOR_ELIGIBILITY.minimumWeightKg) reasons.push('Weight is below the screening minimum');
  if (input.lastDonationAt && (now.getTime() - input.lastDonationAt.getTime()) / 86_400_000 < DONOR_ELIGIBILITY.minimumDaysSinceDonation) reasons.push('Donation gap is too short');
  return reasons;
}
