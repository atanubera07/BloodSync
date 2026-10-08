import Link from 'next/link';
export default function NotFound() {
  return (
    <section className="content-panel">
      <h1>Page not found</h1>
      <p>The page may have moved or the link may be incorrect.</p>
      <Link href="/">Return home</Link>
    </section>
  );
}
