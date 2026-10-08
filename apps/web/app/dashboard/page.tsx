'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AccountGate } from '../../components/AccountGate';
import { apiJson } from '../../lib/api';
export default function Dashboard() {
  const router = useRouter();
  const [logoutError, setLogoutError] = useState('');
  async function logout() {
    try {
      await apiJson('/auth/logout', { method: 'POST' });
      router.replace('/sign-in');
    } catch {
      setLogoutError('Could not sign out. Check your connection and try again.');
    }
  }
  return (
    <AccountGate>
      {(user) => (
        <section>
          <h1>Welcome, {user.fullName}</h1>
          <p>Signed in as {user.email}.</p>
          <div className="card-grid">
            {user.role === 'USER' && (
              <>
                <article className="card">
                  <h2>Find help</h2>
                  <p>Create a request and see anonymized donor matches nearby.</p>
                  <Link href="/requests">Your requests</Link>
                </article>
                <article className="card">
                  <h2>Become a donor</h2>
                  <p>
                    Submit your screening profile for approval and view requests you can help with.
                  </p>
                  <Link href="/donor/profile">Donor profile</Link>
                  <br />
                  <Link href="/donor/matches">Matching requests</Link>
                </article>
              </>
            )}
            {user.role === 'ADMIN' && (
              <article className="card">
                <h2>Review donors</h2>
                <p>Approve or reject pending profiles.</p>
                <Link href="/admin">Admin review</Link>
              </article>
            )}
          </div>
          <p>
            <Link href="/account">Export or delete my data</Link>
          </p>
          {logoutError && <p role="alert">{logoutError}</p>}
          <button className="secondary signout" onClick={() => void logout()}>
            Sign out
          </button>
        </section>
      )}
    </AccountGate>
  );
}
