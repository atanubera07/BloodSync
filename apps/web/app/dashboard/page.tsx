'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AccountGate } from '../../components/AccountGate';
import { WorkspaceFrame } from '../../components/WorkspaceFrame';
import { api, apiJson } from '../../lib/api';
import { useResource } from '../../lib/use-resource';

type DonorStatus = { status: 'PENDING' | 'APPROVED' | 'REJECTED' } | null;
type RequestSummary = { id: string; status: string };
const loadOverview = async () => {
  const [profileResponse, requests] = await Promise.all([
    api('/donors/me'),
    apiJson<RequestSummary[]>('/requests'),
  ]);
  if (!profileResponse.ok && profileResponse.status !== 404)
    throw new Error('Unable to load donor status');
  const profile =
    profileResponse.status === 404 ? null : ((await profileResponse.json()) as DonorStatus);
  return { profile, requests };
};
function UserProgress() {
  const { data, loading, error, reload } = useResource(
    loadOverview,
    'Unable to load your current activity.',
  );
  const donorStatus = data?.profile?.status;
  const nextStep =
    donorStatus === 'APPROVED'
      ? {
          title: 'Approved for matching',
          body: 'Review requests that match your donor profile.',
          href: '/donor/matches',
          action: 'View matching requests',
        }
      : donorStatus === 'PENDING'
        ? {
            title: 'Profile awaiting review',
            body: 'An administrator will review your screening details before matching starts.',
            href: '/donor/profile',
            action: 'View donor profile',
          }
        : donorStatus === 'REJECTED'
          ? {
              title: 'Profile needs an update',
              body: 'Review your screening details before submitting again.',
              href: '/donor/profile',
              action: 'Update donor profile',
            }
          : {
              title: 'Become a potential donor',
              body: 'Complete a donor profile to request an eligibility review.',
              href: '/donor/profile',
              action: 'Start donor profile',
            };
  return (
    <section className="dashboard-progress" aria-labelledby="progress-title">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Current activity</span>
          <h2 id="progress-title">Your next steps</h2>
        </div>
      </div>
      {loading ? (
        <p role="status">Loading your activity…</p>
      ) : error ? (
        <div role="alert">
          <p className="error">{error}</p>
          <button type="button" onClick={reload}>
            Retry
          </button>
        </div>
      ) : data ? (
        <div className="progress-grid">
          <article className="progress-item">
            <span className="workspace-kicker">Donating</span>
            <h3>{nextStep.title}</h3>
            <p>{nextStep.body}</p>
            <Link href={nextStep.href}>{nextStep.action} →</Link>
          </article>
          <article className="progress-item">
            <span className="workspace-kicker">Requesting</span>
            <h3>
              {data.requests.length ? 'Your requests are ready to review' : 'No requests yet'}
            </h3>
            <p>
              {data.requests.length
                ? 'Check status, donor matches, and responses for your recent requests.'
                : 'Create a private request when you need blood donation support.'}
            </p>
            <Link href={data.requests.length ? '/requests' : '/requests/new'}>
              {data.requests.length ? 'Review requests' : 'Create a request'} →
            </Link>
          </article>
        </div>
      ) : null}
    </section>
  );
}

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
        <WorkspaceFrame role={user.role} active="/dashboard">
          <section>
            <div className="workspace-header">
              <div>
                <span className="workspace-kicker">Your BloodSync space</span>
                <h1>Hello, {user.fullName.split(' ')[0]}.</h1>
                <p>Here is where your next helpful step begins.</p>
              </div>
              <span className="badge">
                {user.role === 'ADMIN' ? 'Administrator' : 'Community member'}
              </span>
            </div>
            <div className="workspace-quick" aria-label="Your account at a glance">
              <div className="quick-card">
                <strong>{user.role === 'ADMIN' ? 'Administrator' : 'Community member'}</strong>
                <span>Account role</span>
              </div>
              <div className="quick-card">
                <strong>Signed in</strong>
                <span>{user.email}</span>
              </div>
            </div>
            {user.role === 'USER' && <UserProgress />}
            <div className="section-heading">
              <div>
                <span className="eyebrow">Explore your tools</span>
                <h2>What would you like to do?</h2>
              </div>
            </div>
            <div className="card-grid">
              {user.role === 'USER' ? (
                <>
                  <article className="card">
                    <span className="feature-icon feature-icon-red" aria-hidden="true">
                      ▤
                    </span>
                    <h2>Manage requests</h2>
                    <p>Create a request and review anonymized donor matches when you need help.</p>
                    <Link href="/requests">View your requests →</Link>
                  </article>
                  <article className="card">
                    <span className="feature-icon feature-icon-blue" aria-hidden="true">
                      ♥
                    </span>
                    <h2>Become a donor</h2>
                    <p>Submit a profile for review. You choose when to respond to a match.</p>
                    <Link href="/donor/profile">Open donor profile →</Link>
                  </article>
                  <article className="card">
                    <span className="feature-icon feature-icon-taupe" aria-hidden="true">
                      ◎
                    </span>
                    <h2>See matching needs</h2>
                    <p>Explore requests that match your approved donor profile.</p>
                    <Link href="/donor/matches">View matches →</Link>
                  </article>
                </>
              ) : (
                <>
                  <article className="card">
                    <span className="feature-icon feature-icon-red" aria-hidden="true">
                      ✓
                    </span>
                    <h2>Review donors</h2>
                    <p>Check submitted donor profiles and record approval decisions.</p>
                    <Link href="/admin">Open review queue →</Link>
                  </article>
                  <article className="card">
                    <span className="feature-icon feature-icon-blue" aria-hidden="true">
                      ◌
                    </span>
                    <h2>Account controls</h2>
                    <p>Manage your account data and privacy settings.</p>
                    <Link href="/account">My account →</Link>
                  </article>
                </>
              )}
            </div>
            {logoutError && (
              <p role="alert" className="error">
                {logoutError}
              </p>
            )}
            <button className="secondary signout" onClick={() => void logout()}>
              Sign out
            </button>
          </section>
        </WorkspaceFrame>
      )}
    </AccountGate>
  );
}
