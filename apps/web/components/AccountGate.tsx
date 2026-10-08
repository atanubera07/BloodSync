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
  if (loading) return <p role="status">Loading your account…</p>;
  if (error)
    return (
      <div role="alert">
        <p>{error}</p>
        <button onClick={() => location.reload()}>Retry</button>
      </div>
    );
  if (!user) return <p>Redirecting to sign in…</p>;
  return <>{children(user)}</>;
}
