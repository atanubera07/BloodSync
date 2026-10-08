'use client';
import { useRouter } from 'next/navigation';
import { AccountGate } from '../../components/AccountGate';
import { apiJson } from '../../lib/api';
export default function Dashboard() {
  const router = useRouter();
  async function logout() {
    await apiJson('/auth/logout', { method: 'POST' });
    router.replace('/sign-in');
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
                  <a href="/requests">Your requests</a>
                </article>
                <article className="card">
                  <h2>Become a donor</h2>
                  <p>
                    Submit your screening profile for approval and view requests you can help with.
                  </p>
                  <a href="/donor/profile">Donor profile</a>
                  <br />
                  <a href="/donor/matches">Matching requests</a>
                </article>
              </>
            )}
            {user.role === 'ADMIN' && (
              <article className="card">
                <h2>Review donors</h2>
                <p>Approve or reject pending profiles.</p>
                <a href="/admin">Admin review</a>
              </article>
            )}
          </div>
          <button className="secondary signout" onClick={() => void logout()}>
            Sign out
          </button>
        </section>
      )}
    </AccountGate>
  );
}
