'use client';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import { AuthFrame } from '../../components/AuthFrame';
import { PasswordField } from '../../components/PasswordField';
import { safeAuthDestination } from '../../lib/auth-redirect';
export default function SignIn() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setVerificationRequired(false);
    setPending(true);
    const data = new FormData(event.currentTarget);
    try {
      const response = await api('/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: data.get('email'), password: data.get('password') }),
      });
      if (!response.ok) {
        const body = response.status === 401 ? await response.json().catch(() => ({})) : {};
        const needsVerification = body?.message === 'Verify your email before signing in';
        setVerificationRequired(needsVerification);
        throw new Error(
          needsVerification
            ? 'Verify your email before signing in.'
            : response.status === 429
              ? 'Too many attempts. Please wait 15 minutes and try again.'
              : 'Invalid email or password',
        );
      }
      const next = new URLSearchParams(window.location.search).get('next');
      router.push(safeAuthDestination(next));
    } catch (message) {
      setError(message instanceof Error ? message.message : 'Sign in failed. Try again.');
    } finally {
      setPending(false);
    }
  }
  return (
    <AuthFrame>
      <section className="form-page">
        <span className="eyebrow">Welcome back</span>
        <h1>Good to see you again.</h1>
        <p>Sign in to manage your requests, donor profile, and account.</p>
        <form onSubmit={submit}>
          <label>
            Email
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <PasswordField id="signin-password" autoComplete="current-password" />
          <Link className="auth-recovery-link" href="/forgot-password">
            Forgot your password?
          </Link>
          <button disabled={pending}>{pending ? 'Signing in…' : 'Sign in'}</button>
          {error && (
            <p role="alert">
              {error}{' '}
              {verificationRequired && <Link href="/verify-email">Send a verification link</Link>}
            </p>
          )}
        </form>
        <p>
          New here? <Link href="/sign-up">Create an account</Link>
        </p>
      </section>
    </AuthFrame>
  );
}
