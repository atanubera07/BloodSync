'use client';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { api } from '../../lib/api';
import { AuthFrame } from '../../components/AuthFrame';
export default function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = new FormData(e.currentTarget).get('email');
    setPending(true);
    setError('');
    setSent(false);
    try {
      const response = await api('/auth/password/forgot', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) throw new Error();
      setSent(true);
    } catch {
      setError('Unable to request a reset link. Check your connection and try again.');
    } finally {
      setPending(false);
    }
  }
  return (
    <AuthFrame>
      <section className="form-page">
        <span className="eyebrow">Account recovery</span>
        <h1>Reset your password.</h1>
        <p>Enter your email and we’ll send a link if an account exists.</p>
        <form onSubmit={submit}>
          <label>
            Email
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <button disabled={pending}>{pending ? 'Sending…' : 'Send reset link'}</button>
        </form>
        {error && <p role="alert">{error}</p>}
        {sent && <p role="status">If an account exists, we sent a reset link.</p>}
        <p>
          Remember your password? <Link href="/sign-in">Sign in</Link>
        </p>
      </section>
    </AuthFrame>
  );
}
