'use client';
import Link from 'next/link';
import { useState } from 'react';
import { AccountGate } from '../../components/AccountGate';
import { WorkspaceFrame } from '../../components/WorkspaceFrame';
import { apiJson } from '../../lib/api';
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
      <h1>Account and data</h1>
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
          <AccountActions />
        </WorkspaceFrame>
      )}
    </AccountGate>
  );
}
