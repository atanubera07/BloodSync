export const metadata = {
  title: 'Terms',
  description: 'Terms of use for the BloodSync prototype.',
};
export default function TermsPage() {
  return (
    <article className="content-panel editorial-page">
      <span className="eyebrow">Using BloodSync</span>
      <h1>Terms</h1>
      <p>
        <strong>Template: legal review required before real-world use.</strong> This prototype is
        for software evaluation with synthetic data. Do not rely on it for emergencies or clinical
        decisions.
      </p>
      <p>
        Donor screening thresholds and blood group matching are coordination aids only. Qualified
        clinicians must confirm donor eligibility, blood compatibility and patient care. Contact
        local emergency services or a hospital for urgent medical help.
      </p>
      <p>
        Only enter information you have authority to provide. Do not misuse another person’s account
        or contact information. The project is supplied under the MIT license; deployment operators
        must establish their own lawful privacy, security and operational terms.
      </p>
    </article>
  );
}
