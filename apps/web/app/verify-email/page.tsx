'use client';
import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
function VerifyEmailContent() {
  const token = useSearchParams().get('token');
  const [message, setMessage] = useState('');
  async function verify() {
    const r = await fetch(`${API}/auth/verify-email`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    setMessage(
      r.ok
        ? 'Your email is verified. You can now sign in.'
        : 'This link is invalid or expired. Request another below.',
    );
  }
  async function resend(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = new FormData(e.currentTarget).get('email');
    await fetch(`${API}/auth/verify-email/request`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    setMessage('If an unverified account exists, we sent a new link.');
  }
  return (
    <section className="form-page">
      <h1>Verify your email</h1>
      {token && <button onClick={verify}>Verify email</button>}
      <form onSubmit={resend}>
        <label>
          Email
          <input name="email" type="email" required />
        </label>
        <button>Send a new link</button>
      </form>
      {message && <p role="status">{message}</p>}
    </section>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
