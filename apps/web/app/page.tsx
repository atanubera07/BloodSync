export default function Home() {
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
    </section>
  );
}
