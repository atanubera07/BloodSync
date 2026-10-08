'use client';
import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { api } from '../../lib/api';
function ResetPasswordContent() {
  const token = useSearchParams().get('token');
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const password = new FormData(e.currentTarget).get('password');
    setPending(true);
    setMessage('');
    try {
      const r = await api('/auth/password/reset', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      setMessage(
        r.ok
          ? 'Password updated. Sign in with your new password.'
          : r.status === 400
            ? 'The link is invalid or expired. Request another.'
            : 'Unable to reset now. Try again.',
      );
    } catch {
      setMessage('Network unavailable. Check your connection and try again.');
    } finally {
      setPending(false);
    }
  }
  return (
    <section className="form-page">
      <h1>Choose a new password</h1>
      {token ? (
        <form onSubmit={submit}>
          <label>
            New password
            <input name="password" type="password" minLength={12} maxLength={128} required />
          </label>
          <button disabled={pending}>{pending ? 'Updating…' : 'Update password'}</button>
        </form>
      ) : (
        <p>
          Missing reset link. <a href="/forgot-password">Request a new link</a>.
        </p>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
