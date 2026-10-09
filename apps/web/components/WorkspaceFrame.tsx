import Link from 'next/link';

type Props = { role: 'USER' | 'ADMIN'; active: string; children: React.ReactNode };

export function WorkspaceFrame({ role, active, children }: Props) {
  const links =
    role === 'ADMIN'
      ? [
          { href: '/dashboard', label: 'Overview', icon: '⌂' },
          { href: '/admin', label: 'Donor review', icon: '✓' },
          { href: '/account', label: 'My account', icon: '◌' },
        ]
      : [
          { href: '/dashboard', label: 'Overview', icon: '⌂' },
          { href: '/requests', label: 'My requests', icon: '▤' },
          { href: '/donor/profile', label: 'Donor profile', icon: '♥' },
          { href: '/donor/matches', label: 'Matching requests', icon: '◎' },
          { href: '/account', label: 'My account', icon: '◌' },
        ];
  return (
    <div className="workspace">
      <aside className="workspace-sidebar" aria-label="Workspace navigation">
        <div className="sidebar-brand">
          Blood<span>Sync</span> / workspace
        </div>
        <nav aria-label="Workspace">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active === link.href ? 'page' : undefined}
            >
              <span className="sidebar-icon" aria-hidden="true">
                {link.icon}
              </span>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-note">
          <strong>Care starts with clarity</strong>
          <p>Always confirm medical decisions with qualified professionals.</p>
        </div>
      </aside>
      <div className="workspace-main">{children}</div>
    </div>
  );
}
