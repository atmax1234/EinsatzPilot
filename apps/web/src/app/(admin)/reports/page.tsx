import Link from 'next/link';

import { formatDateTime } from '../../../lib/operations';
import {
  filterReportsOverviewData,
  formatFileSize,
  getAttachmentKindLabel,
  getAttachmentProxyUrl,
  getLatestReviewFeed,
  getReportsFilterOptions,
  getReportReviewStatusLabel,
  getReportsOverviewData,
  type ReportsViewScope,
} from '../../../lib/reports';
import { requireServerSession } from '../../../lib/server-auth';

const allowedScopes = ['ALL', 'REPORTS', 'PHOTOS', 'FILES'] as const satisfies readonly ReportsViewScope[];

function getReportsScope(value: string | undefined): ReportsViewScope {
  return allowedScopes.find((scope) => scope === value) ?? 'ALL';
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string;
    jobId?: string;
    teamId?: string;
    scope?: string;
  }>;
}) {
  const [session, reportsOverview, resolvedSearchParams] = await Promise.all([
    requireServerSession(),
    getReportsOverviewData(),
    searchParams,
  ]);
  const companyLabel = session.activeCompany?.name ?? session.activeCompany?.slug ?? 'Ihre Firma';

  const filters = {
    query: resolvedSearchParams?.q,
    jobId: resolvedSearchParams?.jobId,
    teamId: resolvedSearchParams?.teamId,
  };
  const scope = getReportsScope(resolvedSearchParams?.scope);

  const rawData = reportsOverview.ok && reportsOverview.data ? reportsOverview.data : null;
  const filterOptions = rawData
    ? getReportsFilterOptions(rawData)
    : {
        jobs: [],
        teams: [],
      };
  const filteredData = rawData ? filterReportsOverviewData(rawData, filters) : null;

  const reports = filteredData && (scope === 'ALL' || scope === 'REPORTS') ? filteredData.reports : [];
  const photos =
    filteredData && (scope === 'ALL' || scope === 'PHOTOS') ? filteredData.photoAttachments : [];
  const files =
    filteredData && (scope === 'ALL' || scope === 'FILES') ? filteredData.fileAttachments : [];
  const jobsWithReview = filteredData ? filteredData.jobsWithReview : [];
  const reviewFeed = filteredData
    ? getLatestReviewFeed(
        {
          reports,
          photoAttachments: photos,
          fileAttachments: files,
          jobsWithReview,
        },
        10,
      )
    : [];
  const hasActiveFilters = Boolean(filters.query || filters.jobId || filters.teamId || scope !== 'ALL');
  const hasVisibleResults =
    reports.length > 0 || photos.length > 0 || files.length > 0 || jobsWithReview.length > 0;

  return (
    <main className="content-page">
      <section className="hero-card">
        <p className="eyebrow">Reports</p>
        <h1>Rueckmeldungen und Nachweise pruefen</h1>
        <p>
          Diese Ansicht buendelt eingereichte Berichte, Foto-Nachweise und Belege fuer{' '}
          {companyLabel}. Sie bleibt bewusst nah am operativen Job-Kontext, damit Review
          nicht in einem losgeloesten Dokumentenfriedhof endet.
        </p>
      </section>

      {!reportsOverview.ok ? (
        <section className="panel">
          <p className="eyebrow">Fehlerlage</p>
          <h2>Review-Daten konnten nicht geladen werden</h2>
          <p>
            {reportsOverview.error ??
              'Die Reports-Ansicht hat keine gueltige Antwort vom Backend erhalten.'}
          </p>
        </section>
      ) : null}

      {filteredData ? (
        <>
          <section className="content-grid">
            <article className="panel">
              <p className="eyebrow">Filter</p>
              <h2>Review-Strom eingrenzen</h2>
              <form className="form-stack" method="get">
                <div className="form-grid">
                  <label className="form-field full-span">
                    <span>Suche</span>
                    <input
                      defaultValue={filters.query ?? ''}
                      name="q"
                      placeholder="Auftrag, Bericht, Datei, Team oder Stichwort"
                    />
                  </label>

                  <label className="form-field">
                    <span>Auftrag</span>
                    <select defaultValue={filters.jobId ?? ''} name="jobId">
                      <option value="">Alle Auftraege</option>
                      {filterOptions.jobs.map((job) => (
                        <option key={job.id} value={job.id}>
                          {job.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="form-field">
                    <span>Team</span>
                    <select defaultValue={filters.teamId ?? ''} name="teamId">
                      <option value="">Alle Teams</option>
                      {filterOptions.teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="form-field">
                    <span>Ansicht</span>
                    <select defaultValue={scope} name="scope">
                      <option value="ALL">Alles</option>
                      <option value="REPORTS">Nur Berichte</option>
                      <option value="PHOTOS">Nur Fotos</option>
                      <option value="FILES">Nur Dateien</option>
                    </select>
                  </label>
                </div>

                <div className="form-actions">
                  <button className="primary-button" type="submit">
                    Filter anwenden
                  </button>
                  <Link className="secondary-link" href="/reports">
                    Filter zuruecksetzen
                  </Link>
                </div>
              </form>
            </article>

            <article className="panel">
              <p className="eyebrow">Neueste Eingaege</p>
              <h2>Was zuerst geprueft werden sollte</h2>
              {reviewFeed.length > 0 ? (
                <div className="stack-list">
                  {reviewFeed.map((entry) => (
                    <div className="stack-item" key={`${entry.kind}-${entry.id}`}>
                      <div className="row-spread">
                        <div>
                          <strong>{entry.title}</strong>
                          <p className="compact-text">{entry.subtitle}</p>
                        </div>
                        <span className="inline-chip">
                          {entry.kind === 'REPORT'
                            ? 'Bericht'
                            : entry.kind === 'PHOTO'
                              ? 'Foto'
                              : 'Datei'}
                        </span>
                      </div>
                      <div className="meta-inline">
                        <span>{entry.teamName ?? 'Ohne Teamkontext'}</span>
                        <span>{formatDateTime(entry.createdAt)}</span>
                      </div>
                      <div className="action-row">
                        {entry.attachmentId ? (
                          <a
                            href={getAttachmentProxyUrl(entry.attachmentId)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Datei oeffnen
                          </a>
                        ) : null}
                        <Link href={entry.href}>Zum Auftrag</Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>
                  {hasActiveFilters
                    ? 'Mit den aktuellen Filtern gibt es gerade keine passenden Review-Eingaenge.'
                    : 'Noch keine Review-Eingaenge vorhanden.'}
                </p>
              )}
            </article>
          </section>

          <section className="stats-grid">
            <article className="panel stat-card accent">
              <p className="eyebrow">Berichte</p>
              <h2>{reports.length}</h2>
              <p>Gefilterte Berichte fuer die adminseitige Pruefung.</p>
            </article>

            <article className="panel stat-card neutral">
              <p className="eyebrow">Foto-Nachweise</p>
              <h2>{photos.length}</h2>
              <p>Fotos bleiben jobgebunden, koennen hier aber firmenweit gesichtet werden.</p>
            </article>

            <article className="panel stat-card warn">
              <p className="eyebrow">Jobs mit Reviewbedarf</p>
              <h2>{jobsWithReview.length}</h2>
              <p>Jobs mit passenden Rueckmeldungen oder Nachweisen nach aktuellem Filter.</p>
            </article>
          </section>

          {!hasVisibleResults ? (
            <section className="panel">
              <p className="eyebrow">Keine Treffer</p>
              <h2>Der aktuelle Review-Filter liefert nichts</h2>
              <p>
                Passe Suche, Team, Auftrag oder Ansicht an, um wieder Berichte und Nachweise
                zu sehen.
              </p>
            </section>
          ) : null}

          {(scope === 'ALL' || scope === 'REPORTS' || scope === 'PHOTOS') && (
            <section className="content-grid">
              {(scope === 'ALL' || scope === 'REPORTS') && (
                <article className="panel">
                  <p className="eyebrow">Review-Eingang</p>
                  <h2>Eingereichte Berichte</h2>
                  {reports.length > 0 ? (
                    <div className="stack-list">
                      {reports.map((entry) => (
                        <div className="stack-item" key={entry.report.id}>
                          <div className="row-spread">
                            <div>
                              <strong>{entry.report.summary}</strong>
                              <p className="compact-text">
                                {entry.jobReference} · {entry.jobTitle}
                              </p>
                            </div>
                            <span className="inline-chip">
                              {getReportReviewStatusLabel(entry.report.reviewStatus)}
                            </span>
                          </div>

                          <p>{entry.report.details ?? 'Kein Zusatztext fuer diesen Bericht hinterlegt.'}</p>

                          <div className="meta-inline">
                            <span>{entry.report.author?.name ?? 'Unbekannter Absender'}</span>
                            <span>{entry.report.team?.name ?? 'Ohne Teamkontext'}</span>
                            <span>{formatDateTime(entry.report.createdAt)}</span>
                            <span>{entry.attachments.length} verknuepfte Datei(en)</span>
                          </div>

                          <div className="action-row">
                            <Link href={`/jobs/${entry.jobId}`}>Im Auftrag pruefen</Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>
                      {hasActiveFilters
                        ? 'Kein Bericht passt auf die aktuellen Filter.'
                        : 'Aktuell liegen noch keine eingereichten Berichte fuer die Review-Ansicht vor.'}
                    </p>
                  )}
                </article>
              )}

              {(scope === 'ALL' || scope === 'PHOTOS') && (
                <article className="panel">
                  <p className="eyebrow">Foto-Library</p>
                  <h2>Foto-Nachweise aus allen Auftraegen</h2>
                  {photos.length > 0 ? (
                    <div className="proof-grid">
                      {photos.map((attachment) => (
                        <article className="proof-card" key={attachment.id}>
                          <a href={getAttachmentProxyUrl(attachment.id)} target="_blank" rel="noreferrer">
                            <img
                              className="proof-image"
                              src={getAttachmentProxyUrl(attachment.id)}
                              alt={attachment.caption ?? attachment.fileName}
                            />
                          </a>
                          <strong>{attachment.caption ?? attachment.fileName}</strong>
                          <p className="compact-text">
                            {attachment.job.reference} · {attachment.job.title}
                          </p>
                          <div className="meta-inline">
                            <span>{attachment.team?.name ?? 'Ohne Teamkontext'}</span>
                            <span>{formatDateTime(attachment.uploadedAt)}</span>
                          </div>
                          <div className="action-row">
                            <a href={getAttachmentProxyUrl(attachment.id)} target="_blank" rel="noreferrer">
                              Foto oeffnen
                            </a>
                            <Link href={`/jobs/${attachment.job.id}`}>Zum Auftrag</Link>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p>
                      {hasActiveFilters
                        ? 'Kein Foto passt auf die aktuellen Filter.'
                        : 'Noch keine Foto-Nachweise im firmenweiten Review-Strom vorhanden.'}
                    </p>
                  )}
                </article>
              )}
            </section>
          )}

          <section className="content-grid">
            {(scope === 'ALL' || scope === 'FILES') && (
              <article className="panel">
                <p className="eyebrow">Dateien und Belege</p>
                <h2>Nicht-fotografische Nachweise</h2>
                {files.length > 0 ? (
                  <div className="stack-list">
                    {files.map((attachment) => (
                      <div className="stack-item" key={attachment.id}>
                        <div className="row-spread">
                          <div>
                            <strong>{attachment.fileName}</strong>
                            <p className="compact-text">
                              {attachment.job.reference} · {attachment.job.title}
                            </p>
                          </div>
                          <span className="inline-chip">{getAttachmentKindLabel(attachment.kind)}</span>
                        </div>

                        <div className="meta-inline">
                          <span>{attachment.mimeType}</span>
                          <span>{formatFileSize(attachment.sizeBytes)}</span>
                          <span>{attachment.report?.summary ?? 'Ohne Berichtslink'}</span>
                        </div>

                        <div className="action-row">
                          <a href={getAttachmentProxyUrl(attachment.id)} target="_blank" rel="noreferrer">
                            Datei oeffnen
                          </a>
                          <Link href={`/jobs/${attachment.job.id}`}>Zum Auftrag</Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>
                    {hasActiveFilters
                      ? 'Keine Datei passt auf die aktuellen Filter.'
                      : 'Derzeit sind keine separaten Dateien oder Belege fuer die Review-Ansicht vorhanden.'}
                  </p>
                )}
              </article>
            )}

            <article className="panel">
              <p className="eyebrow">Kontextsprung</p>
              <h2>Jobs mit Rueckmeldungen</h2>
              {jobsWithReview.length > 0 ? (
                <div className="stack-list">
                  {jobsWithReview.map((job) => (
                    <div className="stack-item" key={job.jobId}>
                      <strong>{job.jobTitle}</strong>
                      <p>
                        {job.customerName} · {job.location}
                      </p>
                      <div className="meta-inline">
                        <span>{job.reportCount} Bericht(e)</span>
                        <span>{job.attachmentCount} Datei(en)</span>
                        <span>{job.jobReference}</span>
                      </div>
                      <div className="action-row">
                        <Link href={`/jobs/${job.jobId}`}>Job-Detail oeffnen</Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>
                  {hasActiveFilters
                    ? 'Kein Auftrag hat unter den aktuellen Filtern passende Rueckmeldungen.'
                    : 'Noch kein Auftrag hat Rueckmeldungen oder Nachweise fuer die Review-Stufe gesammelt.'}
                </p>
              )}
            </article>
          </section>
        </>
      ) : null}
    </main>
  );
}
