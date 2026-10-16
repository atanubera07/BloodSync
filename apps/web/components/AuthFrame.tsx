export function AuthFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-layout">
      {children}
      <aside className="auth-aside" aria-label="About BloodSync">
        <span className="auth-aside-mark" aria-hidden="true">
          B.
        </span>
        <div className="auth-aside-content">
          <span className="eyebrow">A considered way to connect</span>
          <h2>Care starts with a clear next step.</h2>
          <p>BloodSync helps people coordinate requests and voluntary donor responses.</p>
          <ul className="auth-principles">
            <li>Donor profiles require administrator review.</li>
            <li>Contact details are shared only after a donor responds with consent.</li>
            <li>Clinical decisions stay with qualified professionals.</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
