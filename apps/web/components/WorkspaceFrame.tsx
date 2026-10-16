import Link from 'next/link';

type Props = { role: 'USER' | 'ADMIN'; active: string; children: React.ReactNode };

export function WorkspaceFrame({ role, active, children }: Props) {
  const links =
    role === 'ADMIN'
      ? [
          { href: '/dashboard', label: 'Overview', index: '01' },
          { href: '/admin', label: 'Donor review', index: '02' },
          { href: '/account', label: 'My account', index: '03' },
        ]
      : [
          { href: '/dashboard', label: 'Overview', index: '01' },
          { href: '/requests', label: 'My requests', index: '02' },
          { href: '/donor/profile', label: 'Donor profile', index: '03' },
          { href: '/donor/matches', label: 'Matching requests', index: '04' },
          { href: '/account', label: 'My account', index: '05' },
        ];
  return (
    <div className="workspace">
      <aside className="workspace-sidebar" aria-label="Workspace navigation">
        <div className="sidebar-brand">
          <span>BloodSync</span>
          <strong>{role === 'ADMIN' ? 'Review workspace' : 'Your workspace'}</strong>
        </div>
        <nav aria-label="Workspace">
          <span className="sidebar-label">Navigate</span>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active === link.href ? 'page' : undefined}
            >
              <span className="sidebar-index" aria-hidden="true">
                {link.index}
              </span>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-note">
          <strong>Clinical decisions stay with care teams.</strong>
          <p>BloodSync supports coordination and does not confirm eligibility.</p>
        </div>
      </aside>
      <div className="workspace-main">{children}</div>
    </div>
  );
}
