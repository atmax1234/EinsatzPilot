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
  const canAccessOfficeFeatures =
    session.membershipRole === 'OWNER' || session.membershipRole === 'OFFICE';
  const isWorker = session.membershipRole === 'WORKER';

  return (
    <div className={`admin-shell ${isWorker ? 'worker-shell' : ''}`}>
      <aside className={`sidebar ${isWorker ? 'worker-sidebar' : ''}`}>
        <div className="sidebar-brand">
          <p className="eyebrow">EinsatzPilot</p>
          <h1>{isWorker ? 'Arbeitsbereich' : 'Admin'}</h1>
          <p>{session.activeCompany?.name ?? session.activeCompany?.slug ?? 'Kein Firmenkontext'}</p>
        </div>

        <nav className="sidebar-nav">
          {isWorker ? (
            <>
              <Link href="/workday-sheets/today">Mein Arbeitstag</Link>
              <Link href="/jobs">Meine Aufträge</Link>
              <Link href="/workday-sheets">Meine Tageszettel</Link>
              <Link href="/dashboard">Übersicht</Link>
            </>
          ) : (
            <>
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/jobs">Aufträge</Link>
              <Link href="/workday-sheets">Tageszettel</Link>
              <Link href="/workday-sheets/today">Heute</Link>
              {canAccessOfficeFeatures ? (
                <Link href="/service-agreements">Leistungsvereinbarungen</Link>
              ) : null}
              <Link href="/customers">Kunden & Adressen</Link>
              <Link href="/objects">Objekte</Link>
              <Link href="/items">Artikel</Link>
              <Link href="/assignments">Zuweisungen</Link>
              <Link href="/teams">Teams</Link>
              <Link href="/reports">Reports</Link>
              {canAccessOfficeFeatures ? (
                <Link href="/customer-reports">Kundenberichte</Link>
              ) : null}
            </>
          )}
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
