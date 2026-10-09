import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Contact',
  description: 'How to contact BloodSync maintainers and report a vulnerability privately.',
  alternates: { canonical: '/contact' },
};
export default function Contact() {
  return (
    <article className="content-panel editorial-page">
      <span className="eyebrow">Get in touch</span>
      <h1>Contact</h1>
      <p>
        For a general project question, use{' '}
        <a href="https://github.com/atanubera07/BloodSync/issues">GitHub issues</a> with synthetic
        examples only. Do not include patient or donor details.
      </p>
      <p>
        For a security concern, use the{' '}
        <a href="https://github.com/atanubera07/BloodSync/security/advisories/new">
          private vulnerability report
        </a>
        . For an emergency, call local emergency services or a hospital.
      </p>
    </article>
  );
}
