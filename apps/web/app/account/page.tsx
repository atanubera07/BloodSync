'use client';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { bloodGroups } from '@bloodsync/shared';
import { AccountGate } from '../../components/AccountGate';
import { WorkspaceFrame } from '../../components/WorkspaceFrame';
import { apiJson } from '../../lib/api';
import { useResource } from '../../lib/use-resource';
type Details = {
  fullName: string;
  email: string;
  phoneNumber: string | null;
  declaredBloodGroup: string | null;
  postalAddress: string | null;
  city: string | null;
  stateRegion: string | null;
};
const loadDetails = () => apiJson<Details>('/me/details');
function AccountDetails() {
  const {
    data: details,
    setData,
    loading,
    error: loadError,
    reload,
  } = useResource(loadDetails, 'Unable to load your account details.');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    const form = new FormData(event.currentTarget);
    const value = (name: string) => String(form.get(name) || '').trim() || null;
    try {
      const updated = await apiJson<Details>('/me/details', {
        method: 'PATCH',
        body: JSON.stringify({
          phoneNumber: value('phoneNumber'),
          declaredBloodGroup: value('declaredBloodGroup'),
          postalAddress: value('postalAddress'),
          city: value('city'),
          stateRegion: value('stateRegion'),
        }),
      });
      setData(updated);
      setNotice('Account details updated. Donor screening details are managed separately.');
    } catch {
      setError('Could not save your details. Check the contact number and try again.');
    } finally {
      setSaving(false);
    }
  }
  return (
    <section className="content-panel">
      <span className="workspace-kicker">Account information</span>
      <h1>Your details</h1>
      <p>
        These are the details supplied at signup. Your blood group here is self-reported and does
        not change your donor profile or approval status.
      </p>
      {loading ? (
        <p role="status">Loading your details…</p>
      ) : loadError ? (
        <div role="alert">
          <p className="error">{loadError}</p>
          <button type="button" onClick={reload}>
            Retry
          </button>
        </div>
      ) : details ? (
        <>
          <p>
            <strong>Name:</strong> {details.fullName}
          </p>
          <p>
            <strong>Verified account email:</strong> {details.email}
          </p>
          <form key={details.email} className="stacked-form" onSubmit={submit}>
            <div className="field-grid">
              <label>
                Contact number
                <input
                  name="phoneNumber"
                  type="tel"
                  autoComplete="tel"
                  maxLength={24}
                  defaultValue={details.phoneNumber || ''}
                />
              </label>
              <label>
                Self-reported blood group
                <select name="declaredBloodGroup" defaultValue={details.declaredBloodGroup || ''}>
                  <option value="">Not provided</option>
                  {bloodGroups.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              Address
              <textarea
                name="postalAddress"
                autoComplete="street-address"
                maxLength={250}
                rows={2}
                defaultValue={details.postalAddress || ''}
              />
            </label>
            <div className="field-grid">
              <label>
                City
                <input
                  name="city"
                  autoComplete="address-level2"
                  maxLength={100}
                  defaultValue={details.city || ''}
                />
              </label>
              <label>
                State or region
                <input
                  name="stateRegion"
                  autoComplete="address-level1"
                  maxLength={100}
                  defaultValue={details.stateRegion || ''}
                />
              </label>
            </div>
            <button disabled={saving}>{saving ? 'Saving…' : 'Save account details'}</button>
          </form>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          {notice && (
            <p role="status" className="success">
              {notice}
            </p>
          )}
        </>
      ) : null}
    </section>
  );
}
function AccountActions() {
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function exportData() {
    setBusy(true);
    setMessage('');
    try {
      const data = await apiJson<unknown>('/me/export');
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
      );
      const link = document.createElement('a');
      link.href = url;
      link.download = 'bloodsync-export.json';
      link.click();
      URL.revokeObjectURL(url);
      setMessage('Your export has downloaded. Store it privately.');
    } catch {
      setMessage('Export failed. Try again.');
    } finally {
      setBusy(false);
    }
  }
  async function deleteAccount() {
    if (
      !window.confirm('Permanently delete your BloodSync account and all donor and request data?')
    )
      return;
    setBusy(true);
    setMessage('');
    try {
      await apiJson('/me', { method: 'DELETE', body: JSON.stringify({ password }) });
      window.location.assign('/');
    } catch {
      setMessage('Deletion failed. Check your password and try again.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="content-panel">
      <span className="workspace-kicker">Privacy controls</span>
      <h2>Account and data</h2>
      <p>
        <Link href="/privacy">Read the privacy policy</Link> before using these controls.
      </p>
      <button className="secondary" type="button" disabled={busy} onClick={exportData}>
        Download my data
      </button>
      <div className="danger-zone">
        <h2>Delete account</h2>
        <p>
          This permanently removes your account, donor profile, requests and sessions. Anonymous
          security event metadata remains.
        </p>
        <label>
          Password confirmation
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />
        </label>
        <button type="button" disabled={busy || !password} onClick={deleteAccount}>
          Delete my account
        </button>
      </div>
      {message && <p role="status">{message}</p>}
    </section>
  );
}
export default function AccountPage() {
  return (
    <AccountGate>
      {(user) => (
        <WorkspaceFrame role={user.role} active="/account">
          <div className="account-stack">
            <AccountDetails />
            <AccountActions />
          </div>
        </WorkspaceFrame>
      )}
    </AccountGate>
  );
}
