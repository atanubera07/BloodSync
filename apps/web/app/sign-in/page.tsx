'use client';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import { AuthFrame } from '../../components/AuthFrame';
export default function SignIn() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setPending(true);
    const data = new FormData(event.currentTarget);
    try {
      const response = await api('/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: data.get('email'), password: data.get('password') }),
      });
      if (!response.ok)
        throw new Error(
          response.status === 429
            ? 'Too many attempts. Please wait 15 minutes and try again.'
            : 'Invalid email or password',
        );
      router.push('/dashboard');
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
          <label>
            Password
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
          <button disabled={pending}>{pending ? 'Signing in…' : 'Sign in'}</button>
          {error && <p role="alert">{error}</p>}
        </form>
        <p>
          <Link href="/forgot-password">Forgot your password?</Link>
        </p>
        <p>
          New here? <Link href="/sign-up">Create an account</Link>
        </p>
      </section>
    </AuthFrame>
  );
}
