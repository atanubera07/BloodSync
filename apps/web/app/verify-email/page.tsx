'use client';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { api } from '../../lib/api';
import { AuthFrame } from '../../components/AuthFrame';
function VerifyEmailContent() {
  const token = useSearchParams().get('token');
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  async function verify() {
    setPending(true);
    try {
      const r = await api('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });
      setMessage(
        r.ok
          ? 'Your email is verified. You can now sign in.'
          : 'This link is invalid or expired. Request another below.',
      );
    } catch {
      setMessage('Unable to verify now. Check your connection and try again.');
    } finally {
      setPending(false);
    }
  }
  async function resend(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = new FormData(e.currentTarget).get('email');
    setPending(true);
    try {
      const response = await api('/auth/verify-email/request', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setMessage(
        response.ok
          ? 'If an unverified account exists, we sent a new link.'
          : 'Unable to request a link. Try again.',
      );
    } catch {
      setMessage('Unable to request a link. Check your connection and try again.');
    } finally {
      setPending(false);
    }
  }
  return (
    <AuthFrame>
      <section className="form-page">
        <span className="eyebrow">One more step</span>
        <h1>Verify your email.</h1>
        <p>Confirm your email before managing requests or becoming a donor.</p>
        {token && (
          <button type="button" disabled={pending} onClick={() => void verify()}>
            {pending ? 'Verifying…' : 'Verify email'}
          </button>
        )}
        <form onSubmit={resend}>
          <label>
            Email
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <button disabled={pending}>Send a new link</button>
        </form>
        {message && <p role="status">{message}</p>}
        <p>
          Already verified? <Link href="/sign-in">Sign in</Link>
        </p>
      </section>
    </AuthFrame>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
