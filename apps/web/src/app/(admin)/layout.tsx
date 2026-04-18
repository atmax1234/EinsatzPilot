import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getMembershipRoleLabel } from '../../lib/admin-mvp';
import { clearDevelopmentSession, requireServerSession } from '../../lib/server-auth';

async function logoutAction() {
  'use server';

  await clearDevelopmentSession();
  redirect('/login');
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireServerSession();

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <p className="eyebrow">EinsatzPilot</p>
          <h1>Admin</h1>
          <p>{session.activeCompany?.name ?? session.activeCompany?.slug ?? 'Kein Firmenkontext'}</p>
        </div>

        <nav className="sidebar-nav">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/jobs">Auftraege</Link>
          <Link href="/teams">Teams</Link>
          <Link href="/reports">Reports</Link>
        </nav>

        <div className="sidebar-user">
          <p>{session.user.displayName ?? session.user.email}</p>
          <span>{getMembershipRoleLabel(session.membershipRole)}</span>
          <form action={logoutAction}>
            <button className="secondary-button" type="submit">
              Abmelden
            </button>
          </form>
        </div>
      </aside>

      <section className="content-shell">{children}</section>
    </div>
  );
}
