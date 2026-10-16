import Link from 'next/link';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { siteUrl } from '../lib/site';
import './style.css';
import { HeaderNav } from '../components/HeaderNav';
import { ToastHost } from '../components/ToastHost';
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'BloodSync', template: '%s | BloodSync' },
  description:
    'Coordinate blood donation requests and approved donor responses with privacy controls.',
  openGraph: {
    type: 'website',
    siteName: 'BloodSync',
    title: 'BloodSync',
    description: 'Private blood donation coordination for patients and donors.',
    images: ['/opengraph-image'],
  },
  twitter: { card: 'summary_large_image' },
};
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await headers(); // Render per request so Next.js can apply the CSP nonce to its scripts.
  return (
    <html lang="en">
      <body>
        <Link className="skip-link" href="#main-content">
          Skip to content
        </Link>
        <div className="site-frame">
          <header className="site-header">
            <div className="header-inner">
              <Link className="brand" href="/" aria-label="BloodSync home">
                <span className="brand-mark" aria-hidden="true">
                  ✦
                </span>
                <span>
                  Blood<span className="brand-accent">Sync</span>
                </span>
              </Link>
              <HeaderNav />
            </div>
          </header>
          <main id="main-content">{children}</main>
          <footer className="site-footer">
            <div className="footer-intro">
              <Link className="footer-brand" href="/">
                BloodSync<span className="brand-accent">.</span>
              </Link>
              <p>Clearer steps between a request and a response.</p>
              <small>
                Prototype for synthetic data. Medical decisions belong to qualified teams.
              </small>
            </div>
            <div className="footer-navigation">
              <nav aria-label="Explore BloodSync">
                <strong>Explore</strong>
                <Link href="/about">About</Link>
                <Link href="/faq">Questions</Link>
                <Link href="/contact">Contact</Link>
              </nav>
              <nav aria-label="Privacy and account">
                <strong>Your information</strong>
                <Link href="/privacy">Privacy</Link>
                <Link href="/terms">Terms</Link>
                <Link href="/account">My data</Link>
              </nav>
            </div>
          </footer>
        </div>
        <ToastHost />
      </body>
    </html>
  );
}
