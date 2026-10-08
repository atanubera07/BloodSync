import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'About',
  description: 'Learn what BloodSync does and how its donor approval and privacy boundaries work.',
  alternates: { canonical: '/about' },
};
export default function About() {
  return (
    <article className="content-panel">
      <h1>About BloodSync</h1>
      <p>
        BloodSync is an open-source prototype by Atanu Bera for coordinating blood requests and
        donor responses. Patients create requests. Donors submit profiles for administrator review.
        Approved donors can see relevant requests, and contact details are shared only after a donor
        expresses interest with active consent.
      </p>
      <h2>Safety boundaries</h2>
      <p>
        BloodSync does not provide emergency medical care, confirm donor eligibility or replace
        laboratory compatibility testing. A hospital and qualified clinician must confirm every
        donation and transfusion decision. For urgent care, contact local emergency services or a
        hospital directly.
      </p>
      <p>
        The code and its development status are available on{' '}
        <a href="https://github.com/atanubera07/BloodSync">GitHub</a>.
      </p>
    </article>
  );
}
