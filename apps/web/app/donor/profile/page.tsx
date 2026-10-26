'use client';
import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { AccountGate } from '../../../components/AccountGate';
import { WorkspaceFrame } from '../../../components/WorkspaceFrame';
import { StatusBadge } from '../../../components/StatusBadge';
import { LocationFields, optionalCoordinates } from '../../../components/LocationFields';
import { api, apiJson } from '../../../lib/api';
import { useResource } from '../../../lib/use-resource';
type Profile = {
  id: string;
  bloodGroup: string;
  birthDate: string;
  weightKg: string;
  lastDonationAt: string | null;
  city: string;
  latitude: string | null;
  longitude: string | null;
  consentToMatch: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
};
import { bloodGroups, DONOR_ELIGIBILITY, PRIVACY_VERSION } from '@bloodsync/shared';
const groups = bloodGroups;
const loadProfile = async () => {
  const response = await api('/donors/me');
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('Unable to load your donor profile.');
  return response.json() as Promise<Profile>;
};
function ProfileForm() {
  const {
    data: profile,
    setData: setProfile,
    loading,
    error: loadError,
    reload,
  } = useResource(loadProfile, 'Unable to load your donor profile.');
  const [saving, setSaving] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [consentToMatch, setConsentToMatch] = useState(false);
  const [healthProcessing, setHealthProcessing] = useState(false);
  const [contactSharing, setContactSharing] = useState(false);
  useEffect(() => {
    setConsentToMatch(profile?.consentToMatch ?? false);
  }, [profile?.consentToMatch]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || withdrawing) return;
    setError('');
    setSuccess('');
    setSaving(true);
    const data = new FormData(event.currentTarget);
    try {
      const updated = await apiJson<Profile>('/donors/me', {
        method: 'PUT',
        body: JSON.stringify({
          bloodGroup: data.get('bloodGroup'),
          birthDate: data.get('birthDate'),
          weightKg: Number(data.get('weightKg')),
          lastDonationAt: data.get('lastDonationAt') || null,
          city: data.get('city'),
          consentToMatch: data.get('consentToMatch') === 'on',
          consent: {
            privacyVersion: PRIVACY_VERSION,
            healthProcessing: data.get('healthProcessing') === 'on',
            contactSharing: data.get('contactSharing') === 'on',
          },
          ...optionalCoordinates(data),
        }),
      });
      setProfile(updated);
      setSuccess('Profile saved. An administrator must approve it before matching starts.');
    } catch (message) {
      setError(String(message instanceof Error ? message.message : message));
    } finally {
      setSaving(false);
    }
  }
  async function withdraw() {
    if (saving || withdrawing) return;
    setWithdrawing(true);
    setError('');
    setSuccess('');
    try {
      await apiJson('/me/consent', { method: 'DELETE' });
      setConsentToMatch(false);
      setHealthProcessing(false);
      setContactSharing(false);
      setProfile((current) => (current ? { ...current, consentToMatch: false } : current));
      setSuccess('Consent withdrawn. Matching and contact sharing stopped.');
    } catch {
      setError('Unable to withdraw consent. Try again.');
    } finally {
      setWithdrawing(false);
    }
  }
  return (
    <section className="content-panel">
      <span className="workspace-kicker">Donor details</span>
      <h1>Donor profile</h1>
      <p>
        Screening information helps an administrator review your profile. Final eligibility is
        decided by a medical professional.
      </p>
      {loading ? (
        <p role="status">Loading profile…</p>
      ) : loadError ? (
        <div role="alert">
          <p className="error">{loadError}</p>
          <button onClick={reload}>Retry</button>
        </div>
      ) : (
        <>
          <div className="donor-status">
            <span>Profile review status</span>
            {profile ? (
              <StatusBadge kind="donor" value={profile.status} />
            ) : (
              <strong>Not submitted</strong>
            )}
          </div>
          <form key={profile?.id || 'new'} onSubmit={submit} className="stacked-form">
            <fieldset className="form-section">
              <legend>Screening details</legend>
              <p className="form-section-copy">
                An administrator reviews these details before matching begins.
              </p>
              <label>
                Blood group
                <select name="bloodGroup" defaultValue={profile?.bloodGroup || ''} required>
                  <option value="" disabled>
                    Select a group
                  </option>
                  {groups.map((group) => (
                    <option key={group}>{group}</option>
                  ))}
                </select>
              </label>
              <div className="field-grid">
                <label>
                  Date of birth
                  <input
                    name="birthDate"
                    type="date"
                    defaultValue={profile?.birthDate?.slice(0, 10) || ''}
                    required
                  />
                </label>
                <label>
                  Weight (kg)
                  <input
                    name="weightKg"
                    type="number"
                    min="1"
                    max="300"
                    step="0.1"
                    defaultValue={profile?.weightKg || ''}
                    required
                  />
                </label>
              </div>
              <label>
                Last donation date, if any
                <input
                  name="lastDonationAt"
                  type="date"
                  defaultValue={profile?.lastDonationAt?.slice(0, 10) || ''}
                />
              </label>
              <label>
                City
                <input
                  name="city"
                  minLength={2}
                  maxLength={100}
                  defaultValue={profile?.city || ''}
                  required
                />
              </label>
            </fieldset>
            <LocationFields
              initialLatitude={profile?.latitude ? Number(profile.latitude) : null}
              initialLongitude={profile?.longitude ? Number(profile.longitude) : null}
            />
            <fieldset className="form-section">
              <legend>Your choices and consent</legend>
              <label className="check">
                <input
                  name="healthProcessing"
                  type="checkbox"
                  checked={healthProcessing}
                  onChange={(event) => setHealthProcessing(event.target.checked)}
                  required
                />
                I consent to processing my screening details under the{' '}
                <Link href="/privacy">privacy policy</Link> (version
                {PRIVACY_VERSION}).
              </label>
              <label className="check">
                <input
                  name="contactSharing"
                  type="checkbox"
                  checked={contactSharing}
                  onChange={(event) => setContactSharing(event.target.checked)}
                  required
                />
                I consent to sharing my account name and email with a request owner if I express
                interest.
              </label>
              <label className="check">
                <input
                  name="consentToMatch"
                  type="checkbox"
                  checked={consentToMatch}
                  onChange={(event) => setConsentToMatch(event.target.checked)}
                />{' '}
                I agree to appear in anonymized donor matches.
              </label>
            </fieldset>
            <p className="hint">
              Screening defaults: age {DONOR_ELIGIBILITY.minimumAgeYears}–
              {DONOR_ELIGIBILITY.maximumAgeYears}, weight at least{' '}
              {DONOR_ELIGIBILITY.minimumWeightKg} kg, and{' '}
              {DONOR_ELIGIBILITY.minimumDaysSinceDonation} days since the last donation. These are
              subject to local clinical review.
            </p>
            <button disabled={saving || withdrawing}>
              {saving ? 'Saving…' : 'Save for review'}
            </button>
          </form>
          <button
            className="secondary"
            type="button"
            disabled={saving || withdrawing}
            onClick={() => void withdraw()}
          >
            {withdrawing ? 'Withdrawing…' : 'Withdraw donor consent'}
          </button>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          {success && (
            <p role="status" className="success">
              {success}
            </p>
          )}
        </>
      )}
    </section>
  );
}
export default function DonorProfilePage() {
  return (
    <AccountGate role="USER">
      {() => (
        <WorkspaceFrame role="USER" active="/donor/profile">
          <ProfileForm />
        </WorkspaceFrame>
      )}
    </AccountGate>
  );
}
