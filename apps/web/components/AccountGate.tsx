'use client';
import { type ReactNode } from 'react';
import { useAccount } from '../lib/use-account';
import type { Account } from '../lib/api';
export function AccountGate({
  role,
  children,
}: {
  role?: 'USER' | 'ADMIN';
  children: (account: Account) => ReactNode;
}) {
  const { user, loading, error } = useAccount(role);
  if (loading)
    return (
      <div className="gate-state gate-loading" role="status">
        <span className="eyebrow">Your BloodSync space</span>
        <p>Loading your account…</p>
        <div className="page-skeleton" aria-hidden="true">
          <span className="skeleton-line skeleton-title" />
          <span className="skeleton-line skeleton-short" />
          <span className="skeleton-line" />
        </div>
      </div>
    );
  if (error)
    return (
      <div className="gate-state gate-error" role="alert">
        <p>{error}</p>
        <button onClick={() => location.reload()}>Retry</button>
      </div>
    );
  if (!user)
    return (
      <p className="gate-state" role="status">
        Redirecting to sign in…
      </p>
    );
  return <>{children(user)}</>;
}
