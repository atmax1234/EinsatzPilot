import type { JobEditableStatus, JobStatus } from '@einsatzpilot/types';

import { notFound } from 'next/navigation';

import {
  createJobReportAction,
  transitionJobStatusAction,
  updateJobAction,
  uploadJobAttachmentAction,
} from '../../../../lib/admin-actions';
import { getStatusTone } from '../../../../lib/admin-mvp';
import {
  formatDateTime,
  getJobDetailData,
  getJobPriorityLabel,
  getJobStatusLabel,
  getTeamsData,
  toDateTimeLocalValue,
} from '../../../../lib/operations';
import {
  formatFileSize,
  getAttachmentKindLabel,
  getAttachmentProxyUrl,
  getReportReviewStatusLabel,
} from '../../../../lib/reports';
import { requireServerSession } from '../../../../lib/server-auth';

const jobDetailNoticeLabels: Record<string, string> = {
  'job-created': 'Der neue Auftrag ist gespeichert und steht jetzt fuer weitere Bearbeitung bereit.',
  'job-updated': 'Die Auftragsdaten wurden aktualisiert.',
  'job-status-updated': 'Der Statuswechsel wurde uebernommen und im Aktivitaetslog dokumentiert.',
  'report-created': 'Der Bericht wurde direkt am Auftrag erfasst.',
  'attachment-uploaded': 'Der Nachweis wurde am Auftrag hinterlegt.',
};

const jobStatusTargets: Record<JobStatus, JobEditableStatus[]> = {
  PLANNED: ['IN_PROGRESS', 'CANCELED'],
  IN_PROGRESS: ['DONE', 'CANCELED'],
  DONE: ['PLANNED'],
  CANCELED: [],
};

function getAllowedStatusTargets(status: JobStatus): JobEditableStatus[] {
  return jobStatusTargets[status];
}

export default async function JobDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ jobId: string }>;
  searchParams?: Promise<{ notice?: string; error?: string }>;
}) {
  await requireServerSession();

  const { jobId } = await params;
  const [jobResult, teamsResult, resolvedSearchParams] = await Promise.all([
    getJobDetailData(jobId),
    getTeamsData(),
    searchParams,
  ]);

  if (!jobResult.ok || !jobResult.data) {
    notFound();
  }

  const job = jobResult.data.job;
  const reports = job.reports ?? [];
  const attachments = job.attachments ?? [];
  const photoAttachments = attachments.filter((attachment) => attachment.kind === 'PHOTO');
  const fileAttachments = attachments.filter((attachment) => attachment.kind === 'FILE');
  const allowedStatusTargets = getAllowedStatusTargets(job.status);
  const flashMessage = resolvedSearchParams?.error
    ? {
        tone: 'error' as const,
        text: resolvedSearchParams.error,
      }
    : resolvedSearchParams?.notice && jobDetailNoticeLabels[resolvedSearchParams.notice]
      ? {
          tone: 'success' as const,
          text: jobDetailNoticeLabels[resolvedSearchParams.notice],
        }
      : null;

  return (
    <main className="content-page">
      <section className="hero-card">
        <p className="eyebrow">Auftragsdetail</p>
        <h1>{job.title}</h1>
        <p>
          {job.reference} · {job.customerName} · {job.location}
        </p>
        <div className="detail-meta">
          <span className={`status-pill ${getStatusTone(job.status)}`}>
            {getJobStatusLabel(job.status)}
          </span>
          <span className="inline-chip">{getJobPriorityLabel(job.priority)}</span>
          <span className="inline-chip">{formatDateTime(job.scheduledStart)}</span>
        </div>
      </section>

      {flashMessage ? (
        <section className={`panel flash-banner ${flashMessage.tone}`}>
          <strong>{flashMessage.tone === 'error' ? 'Aktion fehlgeschlagen' : 'Aktion gespeichert'}</strong>
          <p>{flashMessage.text}</p>
        </section>
      ) : null}

      <section className="content-grid">
        <article className="panel">
          <p className="eyebrow">Beschreibung</p>
          <h2>Einsatzkontext</h2>
          <p>{job.description ?? 'Noch keine Zusatzbeschreibung vorhanden.'}</p>
          <dl className="info-list">
            <div>
              <dt>Zugewiesenes Team</dt>
              <dd>{job.assignedTeam?.name ?? 'Noch nicht zugewiesen'}</dd>
            </div>
            <div>
              <dt>Geplanter Abschluss</dt>
              <dd>{job.scheduledEnd ? formatDateTime(job.scheduledEnd) : 'Noch offen'}</dd>
            </div>
          </dl>
        </article>

        <article className="panel">
          <p className="eyebrow">Disposition</p>
          <h2>Auftrag bearbeiten</h2>
          <form action={updateJobAction.bind(null, job.id)} className="form-stack">
            <div className="form-grid">
              <label className="form-field full-span">
                <span>Titel</span>
                <input defaultValue={job.title} name="title" required />
              </label>

              <label className="form-field">
                <span>Kunde</span>
                <input defaultValue={job.customerName} name="customerName" required />
              </label>

              <label className="form-field">
                <span>Ort</span>
                <input defaultValue={job.location} name="location" required />
              </label>

              <label className="form-field">
                <span>Start</span>
                <input
                  defaultValue={toDateTimeLocalValue(job.scheduledStart)}
                  name="scheduledStart"
                  type="datetime-local"
                  required
                />
              </label>

              <label className="form-field">
                <span>Geplantes Ende</span>
                <input
                  defaultValue={toDateTimeLocalValue(job.scheduledEnd)}
                  name="scheduledEnd"
                  type="datetime-local"
                />
              </label>

              <label className="form-field">
                <span>Prioritaet</span>
                <select defaultValue={job.priority} name="priority">
                  <option value="LOW">Niedrig</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">Hoch</option>
                  <option value="URGENT">Dringend</option>
                </select>
              </label>

              <label className="form-field">
                <span>Team</span>
                <select defaultValue={job.assignedTeam?.id ?? ''} name="teamId">
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
                <textarea defaultValue={job.description ?? ''} name="description" rows={5} />
              </label>
            </div>

            {!teamsResult.ok ? (
              <p className="muted-note">
                Teams konnten nicht geladen werden. Die vorhandene Zuweisung bleibt sichtbar,
                neue Auswahl ist gerade aber nicht verfuegbar.
              </p>
            ) : null}

            <div className="form-actions">
              <button className="primary-button" type="submit">
                Aenderungen speichern
              </button>
            </div>
          </form>
        </article>
      </section>

      <section className="content-grid">
        <article className="panel">
          <p className="eyebrow">Team</p>
          <h2>Beteiligte Personen</h2>
          {job.assignedTeamMembers.length > 0 ? (
            <div className="stack-list">
              {job.assignedTeamMembers.map((member) => (
                <div className="stack-item" key={member.id}>
                  <strong>{member.name}</strong>
                  <p>{member.roleLabel ?? 'Mitarbeiter'}</p>
                  <span>{member.email}</span>
                </div>
              ))}
            </div>
          ) : (
            <p>Fuer das aktuell zugewiesene Team sind noch keine Mitglieder hinterlegt.</p>
          )}
        </article>

        <article className="panel">
          <p className="eyebrow">Status</p>
          <h2>Naechsten erlaubten Schritt ausfuehren</h2>
          {allowedStatusTargets.length > 0 ? (
            <form action={transitionJobStatusAction.bind(null, job.id)} className="form-stack">
              <label className="form-field">
                <span>Neuer Status</span>
                <select defaultValue={allowedStatusTargets[0]} name="status">
                  {allowedStatusTargets.map((status) => (
                    <option key={status} value={status}>
                      {getJobStatusLabel(status)}
                    </option>
                  ))}
                </select>
              </label>

              <div className="form-actions">
                <button className="secondary-button" type="submit">
                  Status wechseln
                </button>
              </div>
            </form>
          ) : (
            <p>
              Fuer den aktuellen Status gibt es im MVP keinen direkten Folgeschritt.
              Falls der Auftrag wieder aktiviert werden soll, muss er zuerst sauber
              ueber den vorgesehenen Pfad geoeffnet werden.
            </p>
          )}

          <div className="stack-list nested-stack">
            <div className="stack-item">
              <strong>Aktuell</strong>
              <p>{getJobStatusLabel(job.status)}</p>
            </div>
            <div className="stack-item">
              <strong>Erlaubte Ziele</strong>
              <p>
                {allowedStatusTargets.length > 0
                  ? allowedStatusTargets.map((status) => getJobStatusLabel(status)).join(', ')
                  : 'Keine direkte Folgeaktion hinterlegt'}
              </p>
            </div>
          </div>
        </article>
      </section>

      <section className="content-grid">
        <article className="panel">
          <p className="eyebrow">Bericht erfassen</p>
          <h2>Office-Rueckmeldung direkt zum Auftrag</h2>
          <form action={createJobReportAction.bind(null, job.id)} className="form-stack">
            <div className="form-grid">
              <label className="form-field full-span">
                <span>Zusammenfassung</span>
                <input
                  name="summary"
                  placeholder="Zum Beispiel Vor-Ort-Abnahme vorbereitet"
                  required
                />
              </label>

              <label className="form-field">
                <span>Teamkontext</span>
                <select defaultValue={job.assignedTeam?.id ?? ''} name="teamId">
                  <option value="">Ohne Teamkontext speichern</option>
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
                <span>Details</span>
                <textarea
                  name="details"
                  placeholder="Was wurde geklaert, was fehlt noch, welcher Nachweis folgt als Nächstes?"
                  rows={5}
                />
              </label>
            </div>

            <div className="form-actions">
              <button className="secondary-button" type="submit">
                Bericht anlegen
              </button>
            </div>
          </form>
        </article>

        <article className="panel">
          <p className="eyebrow">Nachweis hochladen</p>
          <h2>Foto oder Datei am Auftrag hinterlegen</h2>
          <form action={uploadJobAttachmentAction.bind(null, job.id)} className="form-stack">
            <div className="form-grid">
              <label className="form-field full-span">
                <span>Datei</span>
                <input name="file" type="file" required />
              </label>

              <label className="form-field">
                <span>Typ</span>
                <select defaultValue="" name="kind">
                  <option value="">Automatisch aus Dateityp ableiten</option>
                  <option value="PHOTO">Foto</option>
                  <option value="FILE">Datei</option>
                </select>
              </label>

              <label className="form-field">
                <span>Teamkontext</span>
                <select defaultValue={job.assignedTeam?.id ?? ''} name="teamId">
                  <option value="">Ohne Teamkontext speichern</option>
                  {teamsResult.ok && teamsResult.data
                    ? teamsResult.data.teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))
                    : null}
                </select>
              </label>

              <label className="form-field">
                <span>Berichtslink</span>
                <select defaultValue="" name="reportId">
                  <option value="">Direkt am Auftrag speichern</option>
                  {reports.map((report) => (
                    <option key={report.id} value={report.id}>
                      {report.summary}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-field">
                <span>Bildunterschrift / Hinweis</span>
                <input
                  name="caption"
                  placeholder="Kurzbeschreibung fuer die Review-Ansicht"
                />
              </label>
            </div>

            {reports.length === 0 ? (
              <p className="muted-note">
                Es gibt noch keinen verknuepfbaren Bericht. Die Datei kann trotzdem direkt am
                Auftrag gespeichert werden.
              </p>
            ) : null}

            <div className="form-actions">
              <button className="secondary-button" type="submit">
                Nachweis hochladen
              </button>
            </div>
          </form>
        </article>
      </section>

      <section className="content-grid">
        <article className="panel">
          <p className="eyebrow">Berichte</p>
          <h2>Rueckmeldungen zum Auftrag</h2>
          {reports.length > 0 ? (
            <div className="stack-list">
              {reports.map((report) => {
                const linkedAttachments = attachments.filter(
                  (attachment) => attachment.report?.id === report.id,
                );

                return (
                  <div className="stack-item" key={report.id}>
                    <div className="row-spread">
                      <div>
                        <strong>{report.summary}</strong>
                        <p className="compact-text">
                          {report.author?.name ?? 'Unbekannter Absender'} ·{' '}
                          {report.team?.name ?? 'Ohne Teamkontext'}
                        </p>
                      </div>
                      <span className="inline-chip">
                        {getReportReviewStatusLabel(report.reviewStatus)}
                      </span>
                    </div>
                    <p>{report.details ?? 'Dieser Bericht enthaelt keinen Zusatztext.'}</p>
                    <div className="meta-inline">
                      <span>{formatDateTime(report.createdAt)}</span>
                      <span>{linkedAttachments.length} verknuepfte Datei(en)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p>Zu diesem Auftrag liegt aktuell noch kein eingereichter Bericht vor.</p>
          )}
        </article>

        <article className="panel">
          <p className="eyebrow">Nachweise</p>
          <h2>Fotos und Dateien zum Auftrag</h2>

          {photoAttachments.length > 0 ? (
            <div className="proof-grid compact-grid">
              {photoAttachments.map((attachment) => (
                <article className="proof-card" key={attachment.id}>
                  <a href={getAttachmentProxyUrl(attachment.id)} target="_blank" rel="noreferrer">
                    <img
                      className="proof-image"
                      src={getAttachmentProxyUrl(attachment.id)}
                      alt={attachment.caption ?? attachment.fileName}
                    />
                  </a>
                  <strong>{attachment.caption ?? attachment.fileName}</strong>
                  <div className="meta-inline">
                    <span>{attachment.team?.name ?? 'Ohne Teamkontext'}</span>
                    <span>{formatDateTime(attachment.uploadedAt)}</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p>Es wurden noch keine Foto-Nachweise fuer diesen Auftrag hochgeladen.</p>
          )}

          {fileAttachments.length > 0 ? (
            <div className="stack-list nested-stack">
              {fileAttachments.map((attachment) => (
                <div className="stack-item" key={attachment.id}>
                  <div className="row-spread">
                    <div>
                      <strong>{attachment.fileName}</strong>
                      <p className="compact-text">
                        {attachment.report?.summary ?? 'Direkt am Auftrag hinterlegt'}
                      </p>
                    </div>
                    <span className="inline-chip">{getAttachmentKindLabel(attachment.kind)}</span>
                  </div>
                  <div className="meta-inline">
                    <span>{attachment.mimeType}</span>
                    <span>{formatFileSize(attachment.sizeBytes)}</span>
                    <span>{attachment.uploadedBy?.name ?? 'Unbekannter Upload'}</span>
                  </div>
                  <div className="action-row">
                    <a href={getAttachmentProxyUrl(attachment.id)} target="_blank" rel="noreferrer">
                      Datei oeffnen
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </article>
      </section>

      <section className="panel">
        <p className="eyebrow">Aktivitaet</p>
        <h2>Log und Dokumentation</h2>
        <div className="stack-list">
          {job.activity.map((entry) => (
            <div className="stack-item" key={entry.id}>
              <div className="row-spread">
                <strong>{entry.title}</strong>
                <span>{formatDateTime(entry.createdAt)}</span>
              </div>
              <p>{entry.content ?? 'Kein Zusatztext vorhanden.'}</p>
              <span>{entry.authorName ?? entry.kind}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
