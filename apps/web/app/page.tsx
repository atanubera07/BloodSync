import Link from 'next/link';
import { headers } from 'next/headers';
import { siteUrl } from '../lib/site';
import { HeroIllustration } from '../components/HeroIllustration';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Give hope. Find help.',
  description:
    'A considered way to coordinate blood requests and approved donors, with privacy at every step.',
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
    <div className="home-page">
      <section className="home-hero" aria-labelledby="home-title">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="eyebrow-dot" /> A better way to care
          </span>
          <h1 id="home-title">
            When every drop counts, <span>every connection matters.</span>
          </h1>
          <p className="hero-lead">
            BloodSync brings patients and approved donors closer, with clear requests, thoughtful
            matching, and privacy built in.
          </p>
          <div className="actions hero-actions">
            <Link className="button" href="/sign-up">
              Become a donor <span aria-hidden="true">→</span>
            </Link>
            <Link className="button secondary" href="/requests/new">
              Request blood <span aria-hidden="true">→</span>
            </Link>
          </div>
          <p className="hero-caption">
            <span aria-hidden="true">✦</span> People first. Private by design.
          </p>
        </div>
        <div className="hero-art-wrap">
          <HeroIllustration />
        </div>
      </section>

      <div className="care-note" role="note">
        <span className="care-note-icon" aria-hidden="true">
          +
        </span>
        <p>
          For a medical emergency, contact your hospital or local emergency services directly.
          BloodSync helps coordinate next steps; it is not emergency care.
        </p>
      </div>

      <section className="home-section" id="how-it-works" aria-labelledby="how-title">
        <div className="section-intro">
          <div>
            <span className="eyebrow">Simple by design</span>
            <h2 id="how-title">Help flows better together.</h2>
          </div>
          <p>
            From the first request to the right match, each step is designed to be clear,
            respectful, and secure.
          </p>
        </div>
        <div className="home-features">
          <article className="feature-card">
            <span className="feature-icon feature-icon-red" aria-hidden="true">
              01
            </span>
            <h3>Share a request</h3>
            <p>Patients can share their blood group, hospital, and city in a few clear steps.</p>
            <Link href="/requests/new">
              Create a request <span aria-hidden="true">→</span>
            </Link>
          </article>
          <article className="feature-card">
            <span className="feature-icon feature-icon-blue" aria-hidden="true">
              02
            </span>
            <h3>Find the right match</h3>
            <p>
              Approved donors can see relevant requests. Personal contact details stay protected
              until consent.
            </p>
            <Link href="/about">
              How matching works <span aria-hidden="true">→</span>
            </Link>
          </article>
          <article className="feature-card">
            <span className="feature-icon feature-icon-taupe" aria-hidden="true">
              03
            </span>
            <h3>Make an impact</h3>
            <p>
              A donor can respond when they are ready, while medical teams confirm final
              eligibility.
            </p>
            <Link href="/donor/profile">
              Explore donating <span aria-hidden="true">→</span>
            </Link>
          </article>
        </div>
      </section>

      <section className="home-cta" aria-labelledby="cta-title">
        <div>
          <span className="eyebrow">Be part of someone's tomorrow</span>
          <h2 id="cta-title">Your next step could change a life.</h2>
          <p>Create your account to request help or join the community of potential donors.</p>
        </div>
        <Link className="button button-light" href="/sign-up">
          Get started <span aria-hidden="true">→</span>
        </Link>
      </section>
      <script
        type="application/ld+json"
        nonce={nonce}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: structured }}
      />
    </div>
  );
}
