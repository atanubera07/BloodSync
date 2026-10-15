import Link from 'next/link';
import { headers } from 'next/headers';
import { siteUrl } from '../lib/site';
import { HeroIllustration } from '../components/HeroIllustration';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'A clear path from need to response',
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
            <span className="eyebrow-dot" /> Blood donation coordination
          </span>
          <h1 id="home-title">
            A clear path from <span>need to response.</span>
          </h1>
          <p className="hero-lead">
            Create a blood request, or offer to help as a potential donor. BloodSync makes each step
            visible while keeping contact details behind consent.
          </p>
          <div className="actions hero-actions">
            <Link className="button" href="/requests/new">
              Create a request <span aria-hidden="true">→</span>
            </Link>
            <Link className="button secondary" href="/sign-up">
              Explore donating <span aria-hidden="true">→</span>
            </Link>
          </div>
          <p className="hero-caption">Donor matching starts only after administrator approval.</p>
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

      <section className="home-pathways" aria-labelledby="pathways-title">
        <div className="section-intro">
          <div>
            <span className="eyebrow">Find your path</span>
            <h2 id="pathways-title">Two ways to begin.</h2>
          </div>
          <p>Choose the task you came for. You can use both paths from the same account.</p>
        </div>
        <div className="pathway-grid">
          <article className="pathway-card pathway-request">
            <span className="pathway-index">01 / I need support</span>
            <h3>Make the need clear.</h3>
            <p>Share the blood group, units, hospital, city, and timing for a request.</p>
            <ul>
              <li>Your account name stays private from potential donors.</li>
              <li>You can view matches and close a request when it is no longer needed.</li>
            </ul>
            <Link href="/requests/new">
              Start a request <span aria-hidden="true">→</span>
            </Link>
          </article>
          <article className="pathway-card pathway-donor">
            <span className="pathway-index">02 / I want to help</span>
            <h3>Offer help on your terms.</h3>
            <p>Submit a donor profile for review, then see relevant needs after approval.</p>
            <ul>
              <li>You decide when to respond to a request.</li>
              <li>Your contact details are shared only with active consent.</li>
            </ul>
            <Link href="/donor/profile">
              Explore donor profile <span aria-hidden="true">→</span>
            </Link>
          </article>
        </div>
      </section>

      <section className="home-section" id="how-it-works" aria-labelledby="how-title">
        <div className="section-intro">
          <div>
            <span className="eyebrow">The process</span>
            <h2 id="how-title">From request to response.</h2>
          </div>
          <p>
            BloodSync supports coordination. A hospital and qualified medical team confirm all
            donation and transfusion decisions.
          </p>
        </div>
        <div className="home-features">
          <article className="feature-card">
            <span className="feature-icon feature-icon-red" aria-hidden="true">
              01
            </span>
            <h3>Describe the need</h3>
            <p>A request records blood group, hospital, city, units, and when help is needed.</p>
            <Link href="/requests/new">
              Create a request <span aria-hidden="true">→</span>
            </Link>
          </article>
          <article className="feature-card">
            <span className="feature-icon feature-icon-blue" aria-hidden="true">
              02
            </span>
            <h3>Review potential matches</h3>
            <p>
              Approved donor profiles can appear in anonymous matches. Donors choose whether to
              respond.
            </p>
            <Link href="/about">
              How matching works <span aria-hidden="true">→</span>
            </Link>
          </article>
          <article className="feature-card">
            <span className="feature-icon feature-icon-taupe" aria-hidden="true">
              03
            </span>
            <h3>Connect with consent</h3>
            <p>
              A donor’s name and email become available to a request owner only after they respond
              with active contact-sharing consent.
            </p>
            <Link href="/donor/profile">
              Explore donating <span aria-hidden="true">→</span>
            </Link>
          </article>
        </div>
      </section>

      <section className="home-cta" aria-labelledby="cta-title">
        <div>
          <span className="eyebrow">Ready when you are</span>
          <h2 id="cta-title">Take the next step with clarity.</h2>
          <p>
            Create an account to make a request or apply for donor review. Use synthetic details in
            this prototype.
          </p>
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
