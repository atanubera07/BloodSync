import { headers } from 'next/headers';
import { siteUrl } from '../lib/site';
import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Blood donation coordination',
  description:
    'Create a request, find approved donor matches, and share contact details only after consent.',
  alternates: { canonical: '/' },
};
export default async function Home() {
  const nonce = (await headers()).get('x-nonce') || undefined;
  const structured = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Organization', name: 'BloodSync', url: siteUrl },
      {
        '@type': 'WebSite',
        name: 'BloodSync',
        url: siteUrl,
        description: 'Private blood donation coordination',
      },
    ],
  }).replace(/</g, '\\u003c');
  return (
    <section className="hero">
      <p className="eyebrow">Blood donation coordination</p>
      <h1>Make every connection count.</h1>
      <p>
        BloodSync is being built to help patients find approved donors while keeping personal
        contact details private until consent is given.
      </p>
      <div className="actions">
        <a className="button" href="/sign-up">
          Create an account
        </a>
        <a href="/sign-in">Sign in</a>
      </div>
      <p className="notice">
        For a medical emergency, contact local emergency services or your hospital directly.
      </p>
      <div className="home-features">
        <div>
          <h2>For patients</h2>
          <p>
            Create a request with your hospital, blood group and city. See approved donors without
            exposing anyone's contact details.
          </p>
        </div>
        <div>
          <h2>For donors</h2>
          <p>
            Submit your profile for review. If you choose to respond to a request, its owner can
            then contact you.
          </p>
        </div>
      </div>
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: structured }}
      />
    </section>
  );
}
