'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
export default function SignUp() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setPending(true);
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          fullName: data.get('fullName'),
          email: data.get('email'),
          password: data.get('password'),
        }),
      });
      if (!response.ok) throw new Error();
      router.push('/verify-email');
    } catch {
      setError('Account creation failed. Check the details or use another email.');
    } finally {
      setPending(false);
    }
  }
  return (
    <section className="form-page">
      <h1>Create an account</h1>
      <form onSubmit={submit}>
        <label>
          Full name
          <input name="fullName" autoComplete="name" minLength={2} maxLength={100} required />
        </label>
        <label>
          Email
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={12}
            maxLength={128}
            required
          />
          <small>Use at least 12 characters.</small>
        </label>
        <button disabled={pending}>{pending ? 'Creating…' : 'Create account'}</button>
        {error && <p role="alert">{error}</p>}
      </form>
      <p>
        Already registered? <a href="/sign-in">Sign in</a>
      </p>
    </section>
  );
}
