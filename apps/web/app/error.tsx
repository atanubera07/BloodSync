'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="content-panel editorial-page" role="alert">
      <span className="eyebrow">Connection issue</span>
      <h1>Something went wrong</h1>
      <p>Please try again. If the problem continues, check your connection.</p>
      <button type="button" onClick={reset}>
        Retry
      </button>
    </section>
  );
}
