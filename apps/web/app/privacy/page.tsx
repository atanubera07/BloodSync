export const metadata = {
  title: 'Privacy',
  description: 'How BloodSync handles account, donor and request information.',
};
export default function PrivacyPage() {
  return (
    <article className="content-panel editorial-page">
      <span className="eyebrow">Your information</span>
      <h1>Privacy</h1>
      <p>
        <strong>Template: legal review required before real-world use.</strong> BloodSync is an
        early software project. Do not enter real patient or donor information.
      </p>
      <h2>Information and purpose</h2>
      <p>
        We store your name, email, password hash, sessions, consent choices and security events for
        account access. Donor profiles contain blood group, birth date, weight, last donation date,
        city and optional approximate coordinates for screening and matching. Patient requests
        contain requested group, units, urgency, hospital, city and expiry.
      </p>
      <h2>Sharing</h2>
      <p>
        Matching shows limited donor or request information. If a donor expressly responds to a
        request and has active contact sharing consent, its owner can see the donor’s account name
        and email. Administrators can review donor applications and security events.
      </p>
      <h2>Control and retention</h2>
      <p>
        You can withdraw donor consent on the donor profile page, export your data, or delete your
        account from the account page. Withdrawal stops future matching and removes existing
        interests. Deleting an account removes its profiles, requests, sessions and tokens.
        Anonymous audit event type, time and result remain for security review. Production retention
        periods and legal basis require local legal review.
      </p>
      <p>
        Questions and private security reports:{' '}
        <a href="https://github.com/atanubera07/BloodSync/security/advisories/new">
          GitHub private advisory
        </a>
        .
      </p>
    </article>
  );
}
