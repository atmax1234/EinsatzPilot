import Link from 'next/link';

import {
  getDashboardActions,
  getDashboardStats,
  getMembershipRoleLabel,
  getStatusTone,
} from '../../../lib/admin-mvp';
import { formatDateTime, getDashboardData, getJobStatusLabel } from '../../../lib/operations';
import { requireServerSession } from '../../../lib/server-auth';

export default async function DashboardPage() {
  const session = await requireServerSession();
  const dashboardResult = await getDashboardData();
  const stats = getDashboardStats(session);
  const actions = getDashboardActions(session);
  const companyLabel = session.activeCompany?.name ?? session.activeCompany?.slug ?? 'Ihre Firma';

  return (
    <main className="content-page">
      <section className="hero-card">
        <p className="eyebrow">Dashboard</p>
        <h1>Operativer Startpunkt fuer {companyLabel}</h1>
        <p>
          Dieses Dashboard ist jetzt eine echte Admin-Grundlage: Session, Firmenkontext
          und Rollenauflosung kommen live aus der API, und die Seite ist bereits auf
          die naechsten MVP-Kennzahlen vorbereitet.
        </p>
      </section>

      <section className="stats-grid">
        {stats.map((stat) => (
          <article className={`panel stat-card ${stat.tone ?? 'neutral'}`} key={stat.label}>
            <p className="eyebrow">{stat.label}</p>
            <h2>{stat.value}</h2>
            <p>{stat.note}</p>
          </article>
        ))}
      </section>

      <section className="content-grid">
        <article className="panel">
          <p className="eyebrow">Zugangsprofil</p>
          <h2>Admin-Kontext steht</h2>
          <dl className="info-list">
            <div>
              <dt>Name</dt>
              <dd>{session.user.displayName ?? 'nicht gesetzt'}</dd>
            </div>
            <div>
              <dt>E-Mail</dt>
              <dd>{session.user.email}</dd>
            </div>
            <div>
              <dt>Rolle</dt>
              <dd>{getMembershipRoleLabel(session.membershipRole)}</dd>
            </div>
            <div>
              <dt>Firma</dt>
              <dd>{companyLabel}</dd>
            </div>
          </dl>
        </article>

        <article className="panel">
          <p className="eyebrow">Naechste Schritte</p>
          <h2>Worauf die Plattform vorbereitet ist</h2>
          <div className="stack-list">
            {actions.map((action) => (
              <div className="stack-item" key={action.title}>
                <strong>{action.title}</strong>
                <p>{action.description}</p>
                <span className="inline-chip">{action.status}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="content-grid">
        <article className="panel">
          <p className="eyebrow">Live-Ueberblick</p>
          <h2>Dashboard-Daten aus dem API-Modul</h2>
          {dashboardResult.ok && dashboardResult.data ? (
            <div className="stack-list">
              <div className="stack-item">
                <strong>{dashboardResult.data.summary.totalJobs} Auftraege insgesamt</strong>
                <p>
                  {dashboardResult.data.summary.inProgressJobs} aktiv,{' '}
                  {dashboardResult.data.summary.scheduledJobs} geplant und{' '}
                  {dashboardResult.data.summary.completedJobs} abgeschlossen.
                </p>
              </div>
              <div className="stack-item">
                <strong>{dashboardResult.data.summary.activeTeams} Teams einsatzbereit</strong>
                <p>Die Teamansicht zieht bereits echte tenant-sichere Daten fuer den Admin-Bereich.</p>
              </div>
            </div>
          ) : (
            <p>
              Dashboard-Daten konnten noch nicht geladen werden.
              <strong> {dashboardResult.error ?? 'API-Antwort fehlt.'}</strong>
            </p>
          )}
        </article>

        <article className="panel">
          <p className="eyebrow">Fokus-Auftraege</p>
          <h2>Was heute sofort sichtbar ist</h2>
          {dashboardResult.ok && dashboardResult.data ? (
            <div className="stack-list">
              {dashboardResult.data.highlightedJobs.map((job) => (
                <div className="stack-item" key={job.id}>
                  <div className="row-spread">
                    <strong>{job.title}</strong>
                    <span className={`status-pill ${getStatusTone(job.status)}`}>
                      {getJobStatusLabel(job.status)}
                    </span>
                  </div>
                  <p>
                    {job.customerName} · {job.location}
                  </p>
                  <p>{formatDateTime(job.scheduledStart)}</p>
                  <Link href={`/jobs/${job.id}`}>Details oeffnen</Link>
                </div>
              ))}
            </div>
          ) : (
            <p>Ohne Jobschnittstelle bleibt das Dashboard an dieser Stelle stehen.</p>
          )}
        </article>
      </section>
    </main>
  );
}
