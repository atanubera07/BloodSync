import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { siteUrl } from '../lib/site';
import './style.css';
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
        <header>
          <a href="/">BloodSync</a>
          <nav aria-label="Main navigation">
            <a href="/dashboard">Dashboard</a>
            <a href="/requests">Requests</a>
            <a href="/donor/profile">Donate</a>
            <a href="/sign-in">Sign in</a>
          </nav>
        </header>
        <main>{children}</main>
        <footer>
          <span>BloodSync · This service does not replace emergency medical care.</span>
          <nav aria-label="Footer navigation">
            <a href="/about">About</a>
            <a href="/faq">FAQ</a>
            <a href="/contact">Contact</a>
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
            <a href="/account">My data</a>
          </nav>
        </footer>
      </body>
    </html>
  );
}
