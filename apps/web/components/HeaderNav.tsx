'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { apiJson, type Account } from '../lib/api';

export function HeaderNav() {
  const [account, setAccount] = useState<Account | null>(null);
  const pathname = usePathname();
  useEffect(() => {
    let active = true;
    apiJson<Account>('/auth/me')
      .then((value) => {
        if (active) setAccount(value);
      })
      .catch(() => {
        if (active) setAccount(null);
      });
    return () => {
      active = false;
    };
  }, [pathname]);
  return (
    <nav aria-label="Main navigation">
      {account ? (
        <>
          <Link href="/dashboard">Dashboard</Link>
          {account.role === 'ADMIN' ? (
            <Link href="/admin">Admin review</Link>
          ) : (
            <>
              <Link href="/requests">Requests</Link>
              <Link href="/donor/profile">Donate</Link>
            </>
          )}
          <Link href="/account">My account</Link>
        </>
      ) : (
        <Link href="/sign-in">Sign in</Link>
      )}
    </nav>
  );
}
