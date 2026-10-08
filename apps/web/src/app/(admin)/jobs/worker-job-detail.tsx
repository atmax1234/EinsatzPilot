import type { JobDetailResponse } from '@einsatzpilot/types';

import Link from 'next/link';

import {
  formatDateTime,
  getJobPriorityLabel,
  getJobStatusLabel,
} from '../../../lib/operations';
import {
  formatFileSize,
  getAttachmentProxyUrl,
  getJobReportTypeLabel,
  getReportReviewStatusLabel,
} from '../../../lib/reports';
import { WorkerFindingForm } from './worker-finding-form';

type WorkerJobDetailProps = {
  job: JobDetailResponse['job'];
  flash?: { tone: 'error' | 'success'; text: string } | null;
};

export function WorkerJobDetail({ job, flash }: WorkerJobDetailProps) {
  const reports = job.reports ?? [];
  const attachments = job.attachments ?? [];
  const canReport = job.status === 'PLANNED' || job.status === 'IN_PROGRESS';

  return (
    <main className="content-page worker-job-detail-page">
      <section className="hero-card worker-job-hero">
        <Link className="secondary-link" href="/jobs">
          Zurück zu meinen Aufträgen
        </Link>
        <p className="eyebrow">Mein Auftrag · {job.reference}</p>
        <h1>{job.title}</h1>
        <p>{job.address ? `${job.address.street}, ${job.address.postalCode} ${job.address.city}` : job.location}</p>
        <div className="detail-meta">
          <span className="status-pill">{getJobStatusLabel(job.status)}</span>
          <span className="inline-chip">{getJobPriorityLabel(job.priority)}</span>
          <span className="inline-chip">{formatDateTime(job.scheduledStart)}</span>
        </div>
      </section>

      {flash ? (
        <section className={`panel flash-banner ${flash.tone === 'error' ? 'error' : ''}`}>
          <strong>{flash.tone === 'error' ? 'Aktion fehlgeschlagen' : 'Gespeichert'}</strong>
          <p>{flash.text}</p>
        </section>
      ) : null}

      <section className="panel worker-job-context">
        <p className="eyebrow">Einsatz</p>
        <h2>Was du vor Ort wissen musst</h2>
        <p>{job.description ?? 'Für diesen Auftrag gibt es keine zusätzliche Beschreibung.'}</p>
        <dl className="worker-facts">
          <div>
            <dt>Team</dt>
            <dd>{job.assignedTeam?.name ?? 'Direkte Zuweisung'}</dd>
          </div>
          <div>
            <dt>Kunde</dt>
            <dd>{job.customer?.name ?? job.customerName}</dd>
          </div>
          <div>
            <dt>Objekt</dt>
            <dd>{job.object?.name ?? 'Kein Objekt verknüpft'}</dd>
          </div>
          <div>
            <dt>Bereich</dt>
            <dd>{job.objectArea?.name ?? 'Kein Bereich verknüpft'}</dd>
          </div>
          <div>
            <dt>Geplantes Ende</dt>
            <dd>{job.scheduledEnd ? formatDateTime(job.scheduledEnd) : 'Offen'}</dd>
          </div>
        </dl>
      </section>

      <section className="panel worker-finding-panel" id="fund-melden">
        <p className="eyebrow">Fund / Störung</p>
        <h2>Problem mit Nachweis melden</h2>
        <p>
          Beschreibe den Fund getrennt von deiner Tageszettel-Ausführung. Foto oder Video wird
          als Auftragsnachweis gespeichert und kann vom Office geprüft werden.
        </p>
        {canReport ? (
          <WorkerFindingForm
            contextLabel={`${job.reference} · ${job.title}`}
            jobId={job.id}
            returnTo={`/jobs/${job.id}`}
          />
        ) : (
          <div className="worker-finding-unavailable">
            <strong>Dieser Auftrag ist nicht mehr offen.</strong>
            <p>Für neue Funde bitte das Office informieren, damit ein passender Auftrag geöffnet wird.</p>
          </div>
        )}
      </section>

      <section className="panel">
        <p className="eyebrow">Rückmeldungen</p>
        <h2>Bisherige Funde und Berichte</h2>
        {reports.length ? (
          <div className="worker-history-list">
            {reports.map((report) => (
              <article className="worker-history-card" key={report.id}>
                <div className="row-spread">
                  <strong>{report.summary}</strong>
                  <span className="status-pill">{getReportReviewStatusLabel(report.reviewStatus)}</span>
                </div>
                <small>
                  {getJobReportTypeLabel(report.type)} · {formatDateTime(report.createdAt)}
                </small>
                {report.findingSummary ? <p>{report.findingSummary}</p> : null}
                {report.followUpNotes ? <p>Hinweis: {report.followUpNotes}</p> : null}
                {report.attachments.length ? (
                  <span>{report.attachments.length} Nachweis(e) verknüpft</span>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <div className="worksheet-empty-state">
            <h3>Noch keine Rückmeldung</h3>
            <p>Der erste Fund oder Arbeitsbericht erscheint nach dem Speichern hier.</p>
          </div>
        )}
      </section>

      <section className="panel">
        <p className="eyebrow">Nachweise</p>
        <h2>Fotos, Videos und Dateien</h2>
        {attachments.length ? (
          <div className="worker-evidence-grid">
            {attachments.map((attachment) => (
              <a
                className="worker-evidence-card"
                href={getAttachmentProxyUrl(attachment.id)}
                key={attachment.id}
                rel="noreferrer"
                target="_blank"
              >
                {attachment.kind === 'PHOTO' ? (
                  <img
                    alt={attachment.caption ?? attachment.fileName}
                    src={getAttachmentProxyUrl(attachment.id)}
                  />
                ) : (
                  <span className="worker-evidence-file">Datei öffnen</span>
                )}
                <strong>{attachment.caption ?? attachment.fileName}</strong>
                <small>{formatFileSize(attachment.sizeBytes)}</small>
              </a>
            ))}
          </div>
        ) : (
          <div className="worksheet-empty-state">
            <h3>Noch keine Nachweise</h3>
            <p>Optional hochgeladene Fotos oder Videos erscheinen hier.</p>
          </div>
        )}
      </section>
    </main>
  );
}
