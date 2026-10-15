import type { Metadata } from 'next';
import Link from 'next/link';
export const metadata: Metadata = {
  title: 'About',
  description: 'Learn what BloodSync does and how its donor approval and privacy boundaries work.',
  alternates: { canonical: '/about' },
};
export default function About() {
  return (
    <article className="content-panel editorial-page">
      <span className="eyebrow">About the project</span>
      <h1>Coordination with clear boundaries.</h1>
      <p className="editorial-lead">
        BloodSync is an open-source prototype by Atanu Bera. It helps people organize blood requests
        and voluntary donor responses while keeping personal contact behind consent.
      </p>
      <div className="editorial-columns">
        <section>
          <span className="eyebrow">01 / Requesting</span>
          <h2>Share what is needed.</h2>
          <p>
            A request owner records the blood group, units, hospital, city, and timing. They can
            review anonymized donor matches and responses for their own requests.
          </p>
          <Link href="/requests/new">Create a request →</Link>
        </section>
        <section>
          <span className="eyebrow">02 / Donating</span>
          <h2>Choose when to respond.</h2>
          <p>
            Donors submit a profile for administrator review. Approved donors can see relevant
            needs; their name and email are shared only if they respond with active consent.
          </p>
          <Link href="/donor/profile">Explore donor profile →</Link>
        </section>
      </div>
      <section className="editorial-boundary">
        <span className="eyebrow">Safety boundaries</span>
        <h2>Medical decisions stay with medical teams.</h2>
        <p>
          BloodSync does not provide emergency care, confirm donor eligibility, or replace
          laboratory compatibility testing. A hospital and qualified clinician must confirm every
          donation and transfusion decision. For urgent care, contact local emergency services or a
          hospital directly.
        </p>
      </section>
      <p>
        The code and its development status are available on{' '}
        <a href="https://github.com/atanubera07/BloodSync">GitHub</a>.
      </p>
    </article>
  );
}
