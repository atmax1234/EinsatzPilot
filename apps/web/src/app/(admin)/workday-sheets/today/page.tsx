import Link from 'next/link';

import {
  transitionWorkdaySheetAction,
  updateActualWorkdaySheetRowAction,
} from '../../../../lib/workday-sheet-actions';
import {
  formatDateTime,
  getJobsData,
  getJobStatusLabel,
} from '../../../../lib/operations';
import { requireServerSession } from '../../../../lib/server-auth';
import {
  getTodayWorkdaySheetsData,
  getWorkdaySheetsData,
  getWorkdaySheetStatusLabel,
  getWorkdaySheetStatusTone,
} from '../../../../lib/workday-sheets';
import { WorkdaySheetRowSummary } from '../workday-sheet-row-summary';
import { WorkerFindingForm } from '../../jobs/worker-finding-form';

const notices: Record<string, string> = {
  'actual-updated': 'Die Ausführung wurde gespeichert.',
  'status-submitted': 'Der Tageszettel wurde eingereicht.',
  'finding-created': 'Der Fund wurde am Auftrag gespeichert und an das Office übergeben.',
  'finding-with-evidence-created':
    'Der Fund und der Nachweis wurden am Auftrag gespeichert und an das Office übergeben.',
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('de-DE', { dateStyle: 'full', timeZone: 'UTC' }).format(
    new Date(`${value}T00:00:00.000Z`),
  );
}

export default async function WorkdaySheetsTodayPage({
  searchParams,
}: {
  searchParams?: Promise<{ notice?: string; error?: string }>;
}) {
  const [session, todayResult, query] = await Promise.all([
    requireServerSession(),
    getTodayWorkdaySheetsData(),
    searchParams,
  ]);
  const isWorker = session.membershipRole === 'WORKER';
  const today = todayResult.data;
  const [upcomingResult, assignedJobsResult] = isWorker
    ? await Promise.all([getWorkdaySheetsData({ status: 'SENT' }), getJobsData()])
    : [null, null];
  const upcoming = (upcomingResult?.data?.workdaySheets ?? [])
    .filter((sheet) => today && sheet.date > today.date)
    .slice(0, 5);
  const assignedJobs = (assignedJobsResult?.data?.jobs ?? []).filter(
    (job) => job.status === 'PLANNED' || job.status === 'IN_PROGRESS',
  );
  const flash = query?.error
    ? { error: true, text: query.error }
    : query?.notice && notices[query.notice]
      ? { error: false, text: notices[query.notice] }
      : null;

  return (
    <main className="content-page">
      <section className="hero-card">
        <p className="eyebrow">Heute · {today ? formatDate(today.date) : 'Tageszettel'}</p>
        <h1>{isWorker ? 'Meine Arbeit für heute' : 'Tageszettel für heute'}</h1>
        <p>
          {isWorker
            ? 'Geplante Arbeit prüfen, die tatsächliche Ausführung je Zeile festhalten und den vollständigen Tageszettel einreichen.'
            : 'Schneller Überblick über die heute geplanten Tageszettel der Firma.'}
        </p>
        <Link className="secondary-link" href="/workday-sheets">
          Alle Tageszettel
        </Link>
      </section>

      {flash ? (
        <section className={`panel flash-banner ${flash.error ? 'error' : ''}`}>
          <strong>{flash.error ? 'Aktion fehlgeschlagen' : 'Aktion gespeichert'}</strong>
          <p>{flash.text}</p>
        </section>
      ) : null}
      {!todayResult.ok ? (
        <section className="panel flash-banner error">
          <strong>Die heutigen Tageszettel konnten nicht geladen werden.</strong>
          <p>{todayResult.error}</p>
        </section>
      ) : null}

      {today?.workdaySheets.length ? (
        today.workdaySheets.map((sheet) => {
          const canEnterActual = isWorker && sheet.status === 'SENT';
          const isComplete = sheet.rowCount > 0 && sheet.completedRowCount === sheet.rowCount;
          return (
            <section className="panel worksheet-today-card" key={sheet.id}>
              <div className="row-spread">
                <div>
                  <p className="eyebrow">{sheet.team?.name ?? 'Direkte Zuweisung'}</p>
                  <h2>{sheet.title ?? 'Tageszettel ohne Titel'}</h2>
                </div>
                <span
                  className={`status-pill ${getWorkdaySheetStatusTone(sheet.status)}`}
                >
                  {getWorkdaySheetStatusLabel(sheet.status)}
                </span>
              </div>
              <div className="detail-meta">
                <span className="inline-chip">Mitarbeiter: {sheet.worker?.name ?? 'über Team'}</span>
                <span className="inline-chip">
                  Erledigt: {sheet.completedRowCount}/{sheet.rowCount}
                </span>
              </div>

              <div className="worksheet-row-list">
                {sheet.rows.map((row, index) => (
                  <article className="worksheet-row-card" key={row.id}>
                    <WorkdaySheetRowSummary
                      row={row}
                      rowNumber={index + 1}
                      showActual={!canEnterActual}
                    />
                    {canEnterActual ? (
                      <form
                        action={updateActualWorkdaySheetRowAction.bind(null, sheet.id, row.id)}
                        className="form-stack"
                      >
                        <input name="returnTo" type="hidden" value="/workday-sheets/today" />
                        <label className="form-field">
                          <span>Tatsächlich ausgeführt</span>
                          <textarea
                            defaultValue={row.actualText ?? ''}
                            name="actualText"
                            placeholder="Was wurde an dieser Station tatsächlich erledigt?"
                            required
                            rows={5}
                          />
                        </label>
                        <div className="form-actions">
                          <button className="primary-button worker-primary-action" type="submit">
                            Ausführung speichern
                          </button>
                        </div>
                      </form>
                    ) : null}
                    {canEnterActual && row.job ? (
                      <WorkerFindingForm
                        compact
                        contextLabel={`${row.job.reference} · ${row.job.title}`}
                        jobId={row.job.id}
                        returnTo="/workday-sheets/today"
                      />
                    ) : canEnterActual ? (
                      <div className="worker-finding-unavailable">
                        <strong>Problem oder Schaden entdeckt?</strong>
                        <p>
                          Funde und Fotos gehören in einen Auftrag, nicht in den Tageszettel.
                          Diese Zeile hat keinen Auftrag. Öffne unten einen passenden zugewiesenen
                          Auftrag oder informiere das Office, damit der Fund korrekt zugeordnet
                          bleibt.
                        </p>
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>

              <div className="worksheet-today-actions">
                <Link className="secondary-link" href={`/workday-sheets/${sheet.id}`}>
                  Vollständigen Tageszettel öffnen
                </Link>
                {canEnterActual ? (
                  <form action={transitionWorkdaySheetAction.bind(null, sheet.id, 'SUBMITTED')}>
                    <input name="returnTo" type="hidden" value="/workday-sheets/today" />
                    <button
                      className="primary-button worker-primary-action"
                      disabled={!isComplete}
                      type="submit"
                    >
                      Tageszettel einreichen
                    </button>
                  </form>
                ) : null}
              </div>
              {canEnterActual && !isComplete ? (
                <p className="muted-note">
                  Vor dem Einreichen muss für jede Planzeile eine Ausführung gespeichert sein.
                </p>
              ) : null}
            </section>
          );
        })
      ) : (
        <section className="panel worksheet-empty-state">
          <p className="eyebrow">Heute frei</p>
          <h2>Kein sichtbarer Tageszettel für heute</h2>
          <p>
            {isWorker
              ? 'Dir ist heute kein gesendeter Tageszettel direkt oder über ein Team zugewiesen.'
              : 'Für heute wurde noch kein Tageszettel angelegt.'}
          </p>
        </section>
      )}

      {isWorker ? (
        <section className="panel worker-jobs-section">
          <div className="row-spread">
            <div>
              <p className="eyebrow">Zugewiesene Aufträge</p>
              <h2>Meine offenen Aufträge</h2>
            </div>
            <Link className="secondary-link" href="/jobs">
              Alle meine Aufträge
            </Link>
          </div>
          <p className="muted-note">
            Hier kannst du Auftragsdetails öffnen und einen Fund mit Foto oder Video melden.
          </p>
          {!assignedJobsResult?.ok ? (
            <div className="flash-banner error">
              <strong>Die zugewiesenen Aufträge konnten nicht geladen werden.</strong>
              <p>{assignedJobsResult?.error}</p>
            </div>
          ) : assignedJobs.length ? (
            <div className="worker-job-grid">
              {assignedJobs.map((job) => (
                <article className="worker-job-card" key={job.id}>
                  <div className="row-spread">
                    <span className="status-pill">{getJobStatusLabel(job.status)}</span>
                    <small>{job.reference}</small>
                  </div>
                  <h3>{job.title}</h3>
                  <p>{job.address ? `${job.address.street}, ${job.address.city}` : job.location}</p>
                  <span>{formatDateTime(job.scheduledStart)}</span>
                  <Link className="primary-link" href={`/jobs/${job.id}`}>
                    Auftrag öffnen / Fund melden
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="worksheet-empty-state">
              <h3>Keine offenen Aufträge zugewiesen</h3>
              <p>Deine heutigen Tageszettel bleiben davon unabhängig sichtbar.</p>
            </div>
          )}
        </section>
      ) : null}

      {isWorker && upcoming.length ? (
        <section className="panel">
          <p className="eyebrow">Vorschau</p>
          <h2>Kommende gesendete Tageszettel</h2>
          <div className="worksheet-upcoming-list">
            {upcoming.map((sheet) => (
              <Link href={`/workday-sheets/${sheet.id}`} key={sheet.id}>
                <span>{formatDate(sheet.date)}</span>
                <strong>{sheet.title ?? 'Tageszettel ohne Titel'}</strong>
                <small>{sheet.team?.name ?? sheet.worker?.name ?? 'Zuweisung'}</small>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
