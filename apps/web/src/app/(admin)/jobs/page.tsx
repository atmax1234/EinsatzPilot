import Link from 'next/link';

import { getJobsStats } from '../../../lib/admin-mvp';
import { createJobAction } from '../../../lib/admin-actions';
import {
  formatDateTime,
  getJobPriorityLabel,
  getJobsData,
  getJobStatusLabel,
  getTeamsData,
} from '../../../lib/operations';
import { requireServerSession } from '../../../lib/server-auth';

const jobNoticeLabels: Record<string, string> = {
  'job-created': 'Der Auftrag wurde angelegt und kann jetzt weiter disponiert werden.',
};

export default async function JobsPage({
  searchParams,
}: {
  searchParams?: Promise<{ notice?: string; error?: string }>;
}) {
  const [session, jobsResult, teamsResult, resolvedSearchParams] = await Promise.all([
    requireServerSession(),
    getJobsData(),
    getTeamsData(),
    searchParams,
  ]);
  const companyLabel = session.activeCompany?.name ?? session.activeCompany?.slug ?? 'Ihre Firma';
  const stats = getJobsStats();
  const flashMessage = resolvedSearchParams?.error
    ? {
        tone: 'error' as const,
        text: resolvedSearchParams.error,
      }
    : resolvedSearchParams?.notice && jobNoticeLabels[resolvedSearchParams.notice]
      ? {
          tone: 'success' as const,
          text: jobNoticeLabels[resolvedSearchParams.notice],
        }
      : null;

  return (
    <main className="content-page">
      <section className="hero-card">
        <p className="eyebrow">Auftraege</p>
        <h1>Disposition als echte Arbeitsflaeche</h1>
        <p>
          Die Liste ist jetzt nicht mehr nur Leseflaeche. Neue Auftraege koennen direkt
          im Web angelegt werden, waehrend Detailseiten die weitere Bearbeitung,
          Statuswechsel und Nachverfolgung uebernehmen.
        </p>
      </section>

      {flashMessage ? (
        <section className={`panel flash-banner ${flashMessage.tone}`}>
          <strong>{flashMessage.tone === 'error' ? 'Aktion fehlgeschlagen' : 'Aktion gespeichert'}</strong>
          <p>{flashMessage.text}</p>
        </section>
      ) : null}

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
          <p className="eyebrow">Neuer Auftrag</p>
          <h2>Auftrag fuer {companyLabel} anlegen</h2>
          <form action={createJobAction} className="form-stack">
            <div className="form-grid">
              <label className="form-field full-span">
                <span>Titel</span>
                <input name="title" placeholder="Kurzbeschreibung des Einsatzes" required />
              </label>

              <label className="form-field">
                <span>Kunde</span>
                <input name="customerName" placeholder="Kunde oder Ansprechpartner" required />
              </label>

              <label className="form-field">
                <span>Ort</span>
                <input name="location" placeholder="Adresse oder Einsatzort" required />
              </label>

              <label className="form-field">
                <span>Start</span>
                <input name="scheduledStart" type="datetime-local" required />
              </label>

              <label className="form-field">
                <span>Geplantes Ende</span>
                <input name="scheduledEnd" type="datetime-local" />
              </label>

              <label className="form-field">
                <span>Prioritaet</span>
                <select defaultValue="NORMAL" name="priority">
                  <option value="LOW">Niedrig</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">Hoch</option>
                  <option value="URGENT">Dringend</option>
                </select>
              </label>

              <label className="form-field">
                <span>Team</span>
                <select defaultValue="" name="teamId">
                  <option value="">Noch nicht zuweisen</option>
                  {teamsResult.ok && teamsResult.data
                    ? teamsResult.data.teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))
                    : null}
                </select>
              </label>

              <label className="form-field full-span">
                <span>Beschreibung</span>
                <textarea
                  name="description"
                  placeholder="Was soll vor Ort erledigt werden, worauf muss geachtet werden?"
                  rows={5}
                />
              </label>
            </div>

            {!teamsResult.ok ? (
              <p className="muted-note">
                Teams konnten gerade nicht geladen werden. Der Auftrag kann trotzdem ohne
                Zuweisung erstellt werden.
              </p>
            ) : null}

            <div className="form-actions">
              <button className="primary-button" type="submit">
                Auftrag anlegen
              </button>
            </div>
          </form>
        </article>

        <article className="panel">
          <p className="eyebrow">Naechste Schritte</p>
          <h2>Wie die Admin-Flaeche jetzt gedacht ist</h2>
          <div className="stack-list">
            <div className="stack-item">
              <strong>Von der Liste in die Bearbeitung</strong>
              <p>Neue Auftraege landen direkt in der realen Datenbasis und koennen sofort im Detail weiterbearbeitet werden.</p>
            </div>
            <div className="stack-item">
              <strong>Status nur ueber klare Wege</strong>
              <p>Statuswechsel bleiben auf der Detailseite explizit, damit die Backend-Regeln sichtbar und sauber bleiben.</p>
            </div>
            <div className="stack-item">
              <strong>Berichte bleiben verknuepft</strong>
              <p>Sobald vor Ort Rueckmeldungen eingehen, tauchen sie im Auftrag und in der Report-Ansicht ohne zweiten Importweg auf.</p>
            </div>
          </div>
        </article>
      </section>

      <section className="panel">
        <p className="eyebrow">Live-Liste</p>
        <h2>Aktuelle Auftraege fuer {companyLabel}</h2>
        {jobsResult.ok && jobsResult.data ? (
          <div className="table-shell">
            <table className="jobs-table">
              <thead>
                <tr>
                  <th>Auftrag</th>
                  <th>Kunde / Ort</th>
                  <th>Termin</th>
                  <th>Team</th>
                  <th>Status</th>
                  <th>Prioritaet</th>
                  <th>Aktion</th>
                </tr>
              </thead>
              <tbody>
                {jobsResult.data.jobs.map((job) => (
                  <tr key={job.id}>
                    <td>
                      <Link href={`/jobs/${job.id}`}>{job.title}</Link>
                      <span>{job.reference}</span>
                    </td>
                    <td>
                      <strong>{job.customerName}</strong>
                      <span>{job.location}</span>
                    </td>
                    <td>{formatDateTime(job.scheduledStart)}</td>
                    <td>{job.assignedTeam?.name ?? 'Noch nicht zugewiesen'}</td>
                    <td>{getJobStatusLabel(job.status)}</td>
                    <td>{getJobPriorityLabel(job.priority)}</td>
                    <td className="actions-cell">
                      <Link className="table-action" href={`/jobs/${job.id}`}>
                        Oeffnen
                      </Link>
                      <span>Bearbeiten, Status wechseln, Berichte pruefen</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>
            Die Jobliste konnte nicht geladen werden.
            <strong> {jobsResult.error ?? 'Kein API-Ergebnis vorhanden.'}</strong>
          </p>
        )}
      </section>
    </main>
  );
}
