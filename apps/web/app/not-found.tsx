import Link from 'next/link';
export default function NotFound() {
  return (
    <section className="content-panel editorial-page">
      <span className="eyebrow">404 / Page not found</span>
      <h1>Page not found</h1>
      <p>The page may have moved or the link may be incorrect.</p>
      <Link className="button" href="/">
        Return home
      </Link>
    </section>
  );
}
