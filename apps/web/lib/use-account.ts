'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiJson, type Account } from './api';
export function useAccount(requiredRole?: 'USER' | 'ADMIN') {
  const router = useRouter();
  const [user, setUser] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    apiJson<Account>('/auth/me').then(account => {
      if (!active) return;
      if (requiredRole && account.role !== requiredRole) setError('You do not have access to this page.');
      else setUser(account);
    }).catch(message => { if (active) { if (String(message).includes('Unauthorized')) router.replace('/sign-in'); else setError('Unable to load your account.'); } }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [router, requiredRole]);
  return { user, loading, error };
}
