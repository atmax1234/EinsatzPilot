import Link from 'next/link';

import type {
  DashboardFollowUpActivityItem,
  DashboardResponse,
  WorkdaySheetListItem,
} from '@einsatzpilot/types';

import { getStatusTone } from '../../../lib/admin-mvp';
import { formatDateTime, getDashboardData, getJobStatusLabel } from '../../../lib/operations';
import { requireServerSession } from '../../../lib/server-auth';
import {
  getWorkdaySheetStatusLabel,
  getWorkdaySheetStatusTone,
} from '../../../lib/workday-sheets';

function formatCalendarDate(value: string) {
  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'full',
    timeZone: 'UTC',
  }).format(new Date(`${value}T12:00:00.000Z`));
}

function formatUtcPeriod(start: string, endExclusive: string) {
  const formatter = new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
    timeZone: 'UTC',
  });
  const endInclusive = new Date(new Date(endExclusive).getTime() - 1);
  return `${formatter.format(new Date(start))} bis ${formatter.format(endInclusive)}`;
}

function formatCurrency(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

function assignmentLabel(sheet: WorkdaySheetListItem) {
  const assignments = [sheet.team?.name, sheet.worker?.name].filter(Boolean);
  return assignments.length > 0 ? assignments.join(' · ') : 'Keine Zuweisung';
}

function followUpLabel(type: DashboardFollowUpActivityItem['type']) {
  return {
    CREATE_FOLLOW_UP_JOB: 'Folgeauftrag',
    CREATE_JOB_COST_LINE: 'Kostenzeile',
    CREATE_JOB_REPORT: 'Auftragsbericht',
  }[type];
}

function DashboardContent({ data }: { data: DashboardResponse }) {
  const office = data.office;
  const isOffice = data.audience === 'OFFICE' && Boolean(office);
  const openJobs = data.jobs.counts.planned + data.jobs.counts.inProgress;
  const openReviews = office
    ? office.reviewQueue.jobReportsAwaitingReview +
      office.reviewQueue.submittedWorkdaySheetsAwaitingReview
    : 0;

  return (
    <>
      <section className="stats-grid dashboard-stats">
        <article className="panel stat-card accent">
          <p className="eyebrow">Tageszettel heute</p>
          <h2>{data.today.counts.total}</h2>
          <p>
            {data.today.completedRows} von {data.today.totalRows} Arbeitszeilen dokumentiert.
          </p>
        </article>

        <article className="panel stat-card">
          <p className="eyebrow">Offene Aufträge</p>
          <h2>{openJobs}</h2>
          <p>
            {data.jobs.counts.planned} geplant, {data.jobs.counts.inProgress} in Bearbeitung.
          </p>
        </article>

        <article className={`panel stat-card ${isOffice && openReviews > 0 ? 'warn' : ''}`}>
          <p className="eyebrow">{isOffice ? 'Review offen' : 'Abgeschlossene Jobs'}</p>
          <h2>{isOffice ? openReviews : data.jobs.counts.done}</h2>
          <p>
            {isOffice
              ? 'Eingereichte Berichte und Tageszettel warten auf eine Büroprüfung.'
              : 'Abgeschlossene Aufträge in deinem aktuellen Zuweisungsbereich.'}
          </p>
        </article>
      </section>

      <section className="content-grid dashboard-primary-grid">
        <article className="panel">
          <div className="dashboard-section-heading">
            <div>
              <p className="eyebrow">Heute · {formatCalendarDate(data.today.date)}</p>
              <h2>{isOffice ? 'Tageszettel der Firma' : 'Meine Tageszettel'}</h2>
            </div>
            <Link className="secondary-link" href="/workday-sheets/today">
              Tagesansicht öffnen
            </Link>
          </div>

          {data.today.workdaySheets.length > 0 ? (
            <div className="stack-list">
              {data.today.workdaySheets.map((sheet) => (
                <div className="stack-item" key={sheet.id}>
                  <div className="row-spread">
                    <div>
                      <strong>{sheet.title ?? 'Tageszettel ohne Titel'}</strong>
                      <p className="compact-text">{assignmentLabel(sheet)}</p>
                    </div>
                    <span className={`status-pill ${getWorkdaySheetStatusTone(sheet.status)}`}>
                      {getWorkdaySheetStatusLabel(sheet.status)}
                    </span>
                  </div>
                  <div className="meta-inline">
                    <span>
                      {sheet.completedRowCount} von {sheet.rowCount} Zeilen erledigt
                    </span>
                  </div>
                  <div className="action-row">
                    <Link href={`/workday-sheets/${sheet.id}`}>Tageszettel öffnen</Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="dashboard-empty-state">
              <strong>Für heute liegt kein sichtbarer Tageszettel vor.</strong>
              <p>
                {isOffice
                  ? 'Lege bei Bedarf einen Entwurf an oder prüfe die Tageszettel-Liste.'
                  : 'Sobald Büro oder Disposition einen Tageszettel sendet und dir oder deinem Team zuweist, erscheint er hier.'}
              </p>
              <Link href="/workday-sheets">Zur Tageszettel-Liste</Link>
            </div>
          )}
        </article>

        <article className="panel">
          <div className="dashboard-section-heading">
            <div>
              <p className="eyebrow">Auftragslage</p>
              <h2>{isOffice ? 'Operative Jobs' : 'Meine zugewiesenen Jobs'}</h2>
            </div>
            <Link className="secondary-link" href="/jobs">
              Alle Aufträge
            </Link>
          </div>

          <div className="dashboard-status-grid">
            <div><strong>{data.jobs.counts.planned}</strong><span>Geplant</span></div>
            <div><strong>{data.jobs.counts.inProgress}</strong><span>In Bearbeitung</span></div>
            <div><strong>{data.jobs.counts.done}</strong><span>Abgeschlossen</span></div>
            <div><strong>{data.jobs.counts.canceled}</strong><span>Abgebrochen</span></div>
          </div>

          {data.jobs.actionableJobs.length > 0 ? (
            <div className="stack-list dashboard-job-list">
              {data.jobs.actionableJobs.map((job) => (
                <div className="stack-item" key={job.id}>
                  <div className="row-spread">
                    <div>
                      <strong>{job.title}</strong>
                      <p className="compact-text">{job.reference} · {job.customerName}</p>
                    </div>
                    <span className={`status-pill ${getStatusTone(job.status)}`}>
                      {getJobStatusLabel(job.status)}
                    </span>
                  </div>
                  <div className="meta-inline">
                    <span>{formatDateTime(job.scheduledStart)}</span>
                    <span>{job.assignedTeam?.name ?? 'Ohne Team'}</span>
                  </div>
                  <div className="action-row">
                    <Link href={`/jobs/${job.id}`}>Auftrag öffnen</Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="dashboard-empty-state compact">
              <strong>Keine geplanten oder laufenden Jobs.</strong>
              <p>Der aktuelle Zuweisungsbereich enthält gerade keine operativ offenen Aufträge.</p>
            </div>
          )}
        </article>
      </section>

      {office ? (
        <>
          <section className="content-grid dashboard-office-grid">
            <article className="panel">
              <p className="eyebrow">Prüfwarteschlange</p>
              <h2>Was das Büro entscheiden muss</h2>
              <div className="dashboard-review-grid">
                <div>
                  <strong>{office.reviewQueue.jobReportsAwaitingReview}</strong>
                  <span>Berichte eingereicht / Prüfung offen</span>
                  <Link href="/reports">Reports prüfen</Link>
                </div>
                <div>
                  <strong>{office.reviewQueue.submittedWorkdaySheetsAwaitingReview}</strong>
                  <span>Tageszettel eingereicht</span>
                  <Link href="/workday-sheets?status=SUBMITTED">Tageszettel prüfen</Link>
                </div>
              </div>
            </article>

            <article className="panel">
              <p className="eyebrow">Kapazitätskontext</p>
              <h2>Aktive Strukturen</h2>
              <dl className="info-list">
                <div>
                  <dt>Aktive Teams</dt>
                  <dd>{office.workforce.activeTeams}</dd>
                </div>
                <div>
                  <dt>Aktive Zuweisungen</dt>
                  <dd>{office.workforce.activeAssignments}</dd>
                </div>
                <div>
                  <dt>Aktive Leistungsvereinbarungen</dt>
                  <dd>{office.activeServiceAgreementDefinitions}</dd>
                </div>
              </dl>
              <p className="dashboard-disclaimer">
                Vereinbarungen sind hier nur aktive Definitionen. Fällige Ausführungen werden nicht berechnet.
              </p>
              <div className="action-row">
                <Link href="/teams">Teams</Link>
                <Link href="/assignments">Zuweisungen</Link>
                <Link href="/service-agreements">Vereinbarungen</Link>
              </div>
            </article>
          </section>

          <section className="content-grid dashboard-office-grid">
            <article className="panel">
              <p className="eyebrow">Kostenkontrolle</p>
              <h2>Gespeicherte Kosten im laufenden UTC-Monat</h2>
              <p className="compact-text">
                {formatUtcPeriod(
                  office.currentMonthCosts.periodStart,
                  office.currentMonthCosts.periodEndExclusive,
                )}{' '}
                · getrennt nach Währung
              </p>
              {office.currentMonthCosts.totals.length > 0 ? (
                <div className="dashboard-cost-list">
                  {office.currentMonthCosts.totals.map((total) => (
                    <div key={total.currency}>
                      <span>{total.currency}</span>
                      <strong>{formatCurrency(total.amount, total.currency)}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="dashboard-empty-state compact">
                  <strong>Keine Kostenzeilen in diesem Zeitraum.</strong>
                  <p>Es werden ausschließlich gespeicherte Auftragskosten nach Kostendatum summiert.</p>
                </div>
              )}
            </article>

            <article className="panel">
              <p className="eyebrow">Letzte Folgeaktivität</p>
              <h2>Aus geprüften Tageszetteln</h2>
              {office.recentFollowUpActivity.length > 0 ? (
                <div className="stack-list">
                  {office.recentFollowUpActivity.map((activity) => (
                    <div className="stack-item" key={activity.id}>
                      <div className="row-spread">
                        <div>
                          <strong>{followUpLabel(activity.type)}</strong>
                          <p className="compact-text">
                            {activity.sourceSheet.title ?? 'Tageszettel'} · Zeile {activity.sourceRow.position + 1}
                          </p>
                        </div>
                        <span className="status-pill done">Erstellt</span>
                      </div>
                      <p>{activity.sourceRow.actualText ?? activity.sourceRow.plannedText}</p>
                      <div className="meta-inline">
                        <span>{activity.createdBy.name}</span>
                        <span>{formatDateTime(activity.completedAt)}</span>
                      </div>
                      <div className="action-row">
                        <Link href={`/workday-sheets/${activity.sourceSheet.id}`}>Quelle</Link>
                        <Link href={`/jobs/${activity.destinationJob.id}`}>Zielauftrag</Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="dashboard-empty-state compact">
                  <strong>Noch keine Folgeaktivität.</strong>
                  <p>Explizite Review-Aktionen aus geprüften Tageszetteln erscheinen hier.</p>
                </div>
              )}
            </article>
          </section>
        </>
      ) : null}

      <details className="panel dashboard-definitions">
        <summary>So werden diese Kennzahlen gezählt</summary>
        <ul>
          <li>„Heute“ vergleicht das Tageszettel-Datum mit dem lokalen Kalendertag des API-Servers.</li>
          <li>Eine Zeile gilt als erledigt, wenn ein tatsächlicher Arbeitstext gespeichert ist.</li>
          <li>Offene Jobs sind ausschließlich die Status „Geplant“ und „In Bearbeitung“.</li>
          {office ? (
            <>
              <li>Review offen umfasst Jobberichte mit „Eingereicht“ oder „Prüfung offen“ sowie Tageszettel mit „Eingereicht“.</li>
              <li>Teams, Zuweisungen und Vereinbarungen werden nur nach ihrem gespeicherten Aktiv-Status gezählt.</li>
              <li>Kosten verwenden das gespeicherte Kostendatum im aktuellen UTC-Kalendermonat und werden nie über Währungen hinweg addiert.</li>
            </>
          ) : (
            <li>Für Mitarbeiter werden Tageszettel und Jobs auf direkte oder Team-Zuweisungen eingeschränkt.</li>
          )}
        </ul>
      </details>

      <p className="dashboard-generated-at">
        Serverstand: {formatDateTime(data.generatedAt)}
      </p>
    </>
  );
}

export default async function DashboardPage() {
  const [session, dashboardResult] = await Promise.all([
    requireServerSession(),
    getDashboardData(),
  ]);
  const companyLabel = session.activeCompany?.name ?? session.activeCompany?.slug ?? 'Ihre Firma';

  return (
    <main className="content-page command-center-page">
      <section className="hero-card">
        <p className="eyebrow">Kommandozentrale</p>
        <h1>{dashboardResult.data?.audience === 'WORKER' ? 'Mein Arbeitstag' : 'Betrieb im Blick'}</h1>
        <p>
          {dashboardResult.data?.audience === 'WORKER'
            ? `Zugewiesene Tageszettel und Aufträge für ${session.user.displayName ?? session.user.email}.`
            : `Aktueller, serverseitig berechneter Überblick für ${companyLabel} — ohne hochgerechnete Termine oder Demo-Werte.`}
        </p>
      </section>

      {dashboardResult.ok && dashboardResult.data ? (
        <DashboardContent data={dashboardResult.data} />
      ) : (
        <section className="panel flash-banner error">
          <p className="eyebrow">Dashboard nicht verfügbar</p>
          <h2>Die operative Lage konnte nicht geladen werden</h2>
          <p>{dashboardResult.error ?? 'Die API hat keine gültige Antwort geliefert.'}</p>
          <div className="action-row">
            <Link href="/dashboard">Erneut laden</Link>
            <Link href="/jobs">Aufträge direkt öffnen</Link>
          </div>
        </section>
      )}
    </main>
  );
}
