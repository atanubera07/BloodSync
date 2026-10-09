export function AuthFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-layout">
      {children}
      <aside className="auth-aside" aria-label="About BloodSync">
        <div className="auth-aside-content">
          <span className="eyebrow">Care, with clarity</span>
          <h2>Every connection deserves trust.</h2>
          <p>Private requests and approved donors, brought together with clear next steps.</p>
        </div>
      </aside>
    </div>
  );
}
