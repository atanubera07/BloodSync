import Link from 'next/link';

type Props = {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  action?: { href: string; label: string };
};

export function EmptyState({ eyebrow, title, children, action }: Props) {
  return (
    <div className="empty-state">
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      <p>{children}</p>
      {action && <Link href={action.href}>{action.label} →</Link>}
    </div>
  );
}
