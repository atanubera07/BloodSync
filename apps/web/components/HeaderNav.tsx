'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { apiJson, type Account } from '../lib/api';

export function HeaderNav() {
  const [account, setAccount] = useState<Account | null>(null);
  const [ready, setReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => {
    let active = true;
    setMenuOpen(false);
    setReady(false);
    apiJson<Account>('/auth/me')
      .then((value) => {
        if (active) setAccount(value);
      })
      .catch(() => {
        if (active) setAccount(null);
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, [pathname]);
  return (
    <>
      <button
        className="menu-toggle"
        type="button"
        aria-expanded={menuOpen}
        aria-controls="main-navigation"
        onClick={() => setMenuOpen((open) => !open)}
      >
        {menuOpen ? 'Close' : 'Menu'} <span aria-hidden="true">{menuOpen ? '×' : '☰'}</span>
      </button>
      <nav
        id="main-navigation"
        className={`main-nav${menuOpen ? ' is-open' : ''}`}
        aria-label="Main navigation"
      >
        <Link href="/" aria-current={pathname === '/' ? 'page' : undefined}>
          Home
        </Link>
        <Link href="/#how-it-works">How it works</Link>
        {account?.role === 'ADMIN' ? (
          <>
            <Link href="/admin" aria-current={pathname === '/admin' ? 'page' : undefined}>
              Donor review
            </Link>
          </>
        ) : (
          <>
            <Link href="/donor/profile">Donate</Link>
            <Link href="/requests/new">Request blood</Link>
          </>
        )}
        {!ready ? (
          <span className="nav-loading" aria-live="polite">
            Checking account…
          </span>
        ) : account ? (
          <>
            <Link href={account.role === 'ADMIN' ? '/admin' : '/dashboard'} className="nav-pill">
              {account.role === 'ADMIN' ? 'Admin space' : 'Dashboard'}
            </Link>
            <Link href="/account" className="nav-account" aria-label="My account">
              {account.fullName.slice(0, 1).toUpperCase()}
            </Link>
          </>
        ) : (
          <>
            <Link href="/sign-in" className="nav-signin">
              Sign in
            </Link>
            <Link href="/sign-up" className="nav-pill">
              Get started <span aria-hidden="true">→</span>
            </Link>
          </>
        )}
      </nav>
    </>
  );
}
