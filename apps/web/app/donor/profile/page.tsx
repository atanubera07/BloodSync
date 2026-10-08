'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { AccountGate } from '../../../components/AccountGate';
import { LocationFields, optionalCoordinates } from '../../../components/LocationFields';
import { api, apiJson } from '../../../lib/api';
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
  status: string;
};
const groups = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];
function ProfileForm() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  useEffect(() => {
    let active = true;
    api('/donors/me')
      .then(async (response) => {
        if (response.status === 404) return null;
        if (!response.ok) throw new Error();
        return response.json() as Promise<Profile>;
      })
      .then((data) => {
        if (active) setProfile(data);
      })
      .catch(() => {
        if (active) setError('Unable to load your donor profile.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
  return (
    <section className="content-panel">
      <h1>Donor profile</h1>
      <p>
        Screening information helps an administrator review your profile. Final eligibility is
        decided by a medical professional.
      </p>
      {loading ? (
        <p role="status">Loading profile…</p>
      ) : (
        <>
          <p className="status-line">
            Status: <strong>{profile?.status.toLowerCase() || 'Not submitted'}</strong>
          </p>
          <form key={profile?.id || 'new'} onSubmit={submit} className="stacked-form">
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
            <LocationFields
              initialLatitude={profile?.latitude ? Number(profile.latitude) : null}
              initialLongitude={profile?.longitude ? Number(profile.longitude) : null}
            />
            <label className="check">
              <input
                name="consentToMatch"
                type="checkbox"
                defaultChecked={profile?.consentToMatch || false}
              />{' '}
              I agree to appear in anonymized donor matches.
            </label>
            <p className="hint">
              Screening defaults: age 18–65, weight at least 45 kg, and 90 days since the last
              donation. These are subject to local clinical review.
            </p>
            <button disabled={saving}>{saving ? 'Saving…' : 'Save for review'}</button>
          </form>
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
  return <AccountGate role="USER">{() => <ProfileForm />}</AccountGate>;
}
