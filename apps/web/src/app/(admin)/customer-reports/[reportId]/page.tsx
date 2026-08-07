import { customerReportTypes } from '@einsatzpilot/schemas';
import type { CustomerReportStatus } from '@einsatzpilot/types';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  updateCustomerReportAction,
  updateCustomerReportStatusAction,
} from '../../../../lib/customer-report-actions';
import {
  formatCustomerReportDate,
  getCustomerReportData,
  getCustomerReportStatusLabel,
  getCustomerReportStatusTone,
  getCustomerReportTypeLabel,
  toCustomerReportDateInput,
} from '../../../../lib/customer-reports';
import {
  formatJobCostDate,
  formatJobCostMoney,
  getJobCostKindLabel,
  getJobCostUnitLabel,
} from '../../../../lib/job-costs';
import { formatDateTime } from '../../../../lib/operations';
import {
  formatFileSize,
  getAttachmentProxyUrl,
  getJobReportTypeLabel,
  getReportReviewStatusLabel,
} from '../../../../lib/reports';
import { requireServerSession } from '../../../../lib/server-auth';
import { CustomerReportDocument } from '../customer-report-document';
import { CustomerReportPrintButton } from '../customer-report-print-button';

const noticeLabels: Record<string, string> = {
  'customer-report-created': 'Der Kundenbericht wurde als stabiler Entwurf angelegt.',
  'customer-report-updated': 'Die bearbeitbaren Berichtsfelder wurden aktualisiert.',
  'customer-report-status-updated': 'Der Berichtsstatus wurde aktualisiert.',
};

const statusTargets: Record<CustomerReportStatus, CustomerReportStatus[]> = {
  DRAFT: ['READY_FOR_REVIEW', 'ARCHIVED'],
  READY_FOR_REVIEW: ['DRAFT', 'APPROVED'],
  APPROVED: ['ARCHIVED'],
  ARCHIVED: [],
};

function getStatusActionLabel(status: CustomerReportStatus) {
  return {
    DRAFT: 'Zur Bearbeitung zurueckgeben',
    READY_FOR_REVIEW: 'Zur Pruefung bereitstellen',
    APPROVED: 'Kundenbericht freigeben',
    ARCHIVED: 'Kundenbericht archivieren',
  }[status];
}

export default async function CustomerReportDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ reportId: string }>;
  searchParams?: Promise<{ notice?: string; error?: string }>;
}) {
  const session = await requireServerSession();
  const { reportId } = await params;
  const [customerReportResult, resolvedSearchParams] = await Promise.all([
    getCustomerReportData(reportId),
    searchParams,
  ]);

  if (customerReportResult.status === 404) {
    notFound();
  }

  const report = customerReportResult.data?.customerReport;
  if (!customerReportResult.ok || !report) {
    return (
      <main className="content-page">
        <section className="panel flash-banner error">
          <strong>Kundenbericht konnte nicht geladen werden.</strong>
          <p>{customerReportResult.error ?? 'Die API hat keine gueltige Antwort geliefert.'}</p>
          <Link href="/customer-reports">Zu den Kundenberichten</Link>
        </section>
      </main>
    );
  }

  const canManage =
    session.membershipRole === 'OWNER' || session.membershipRole === 'OFFICE';
  const canEdit = canManage && report.status === 'DRAFT';
  const allowedStatusTargets = statusTargets[report.status];
  const source = report.snapshotSourceData;
  const costBreakdown = report.snapshotCostBreakdown;
  const jobReports = [...source.jobReports].sort(
    (left, right) => left.position - right.position,
  );
  const attachments = [...source.attachments].sort(
    (left, right) => left.position - right.position,
  );
  const selectedCostLines = costBreakdown
    ? [...costBreakdown.selectedLines].sort(
        (left, right) => left.position - right.position,
      )
    : [];
  const flashMessage = resolvedSearchParams?.error
    ? { tone: 'error', text: resolvedSearchParams.error }
    : resolvedSearchParams?.notice && noticeLabels[resolvedSearchParams.notice]
      ? { tone: 'success', text: noticeLabels[resolvedSearchParams.notice] }
      : null;
  const {
    internalNotes,
    createdBy,
    approvedBy,
    ...customerVisibleReport
  } = report;

  return (
    <main className="content-page customer-report-detail-page">
      <section className="hero-card report-admin-only">
        <p className="eyebrow">Kundenbericht {report.reportNumber}</p>
        <h1>{report.title}</h1>
        <p>
          {getCustomerReportTypeLabel(report.type)} · {report.recipientName} ·{' '}
          {report.snapshotJobReference}
        </p>
        <div className="detail-meta">
          <span className={`status-pill ${getCustomerReportStatusTone(report.status)}`}>
            {getCustomerReportStatusLabel(report.status)}
          </span>
          <span className="inline-chip">Erstellt {formatDateTime(report.createdAt)}</span>
          {report.approvedAt ? (
            <span className="inline-chip">Freigegeben {formatDateTime(report.approvedAt)}</span>
          ) : null}
        </div>
        <div className="action-row">
          <Link href="/customer-reports">Zur Berichtsliste</Link>
          {report.jobId ? <Link href={`/jobs/${report.jobId}`}>Zum Auftrag</Link> : null}
        </div>
      </section>

      {flashMessage ? (
        <section className={`panel flash-banner ${flashMessage.tone} report-admin-only`}>
          <strong>
            {flashMessage.tone === 'error' ? 'Aktion fehlgeschlagen' : 'Aktion gespeichert'}
          </strong>
          <p>{flashMessage.text}</p>
        </section>
      ) : null}

      <section className="panel print-controls-panel report-admin-only">
        <div>
          <p className="eyebrow">Kundenansicht</p>
          <h2>Browserdruck vorbereiten</h2>
          <p>
            Der Druck verwendet ausschliesslich den unten dargestellten gespeicherten
            Snapshot. Navigation, Formulare, interne Notizen, Quelldiagnosen und
            Buero-Metadaten werden ausgeblendet.
          </p>
        </div>
        <div className="print-control-actions">
          <CustomerReportPrintButton />
          <small>Browserdruck / Druckansicht · kein PDF-Export</small>
        </div>
      </section>

      <CustomerReportDocument report={customerVisibleReport} />

      <section className="panel internal-notes-panel report-admin-only">
        <div className="row-spread">
          <div>
            <p className="eyebrow">Nur intern</p>
            <h2>Interne Notizen des Bueros</h2>
          </div>
          <span className="internal-only-badge">Nie im Kundendruck</span>
        </div>
        <p>{internalNotes ?? 'Fuer diesen Kundenbericht sind keine internen Notizen hinterlegt.'}</p>
      </section>

      <section className="content-grid report-admin-only">
        <article className="panel">
          <p className="eyebrow">Snapshot-Pruefung</p>
          <h2>Gespeicherter Darstellungsstand</h2>
          <dl className="info-list">
            <div>
              <dt>Schema-Version</dt>
              <dd>{source.schemaVersion}</dd>
            </div>
            <div>
              <dt>Erfasst</dt>
              <dd>{formatDateTime(source.capturedAt)}</dd>
            </div>
            <div>
              <dt>Auftrag</dt>
              <dd>{report.snapshotJobReference} · {report.snapshotJobTitle}</dd>
            </div>
            <div>
              <dt>Kopierte Quellen</dt>
              <dd>
                {jobReports.length} Bericht(e), {attachments.length} Nachweis(e),{' '}
                {selectedCostLines.length} Kostenzeile(n)
              </dd>
            </div>
          </dl>
          <p className="muted-note nested-stack">
            Die Kundenansicht liest keine aktuellen Auftrags-, Stamm-, Berichts- oder
            Kostendaten nach.
          </p>
        </article>

        <article className="panel">
          <p className="eyebrow">Statusverwaltung</p>
          <h2>Pruefung und Freigabe</h2>
          <p>
            Aktueller Stand: <strong>{getCustomerReportStatusLabel(report.status)}</strong>
          </p>
          <p className="compact-text">
            Angelegt von {createdBy.name} am {formatDateTime(report.createdAt)}.
          </p>
          {approvedBy ? (
            <p className="compact-text">
              Administrative Freigabe durch {approvedBy.name}
              {report.approvedAt ? ` am ${formatDateTime(report.approvedAt)}` : ''}.
            </p>
          ) : null}
          {canManage && allowedStatusTargets.length > 0 ? (
            <div className="stack-list nested-stack">
              {allowedStatusTargets.map((status) => (
                <form
                  action={updateCustomerReportStatusAction.bind(null, report.id)}
                  className="stack-item"
                  key={status}
                >
                  <input name="status" type="hidden" value={status} />
                  <strong>{getStatusActionLabel(status)}</strong>
                  <p className="compact-text">
                    {status === 'READY_FOR_REVIEW'
                      ? 'Der Entwurf wird gegen weitere Inhaltsaenderungen gesperrt.'
                      : status === 'DRAFT'
                        ? 'Der Bericht kann danach wieder bearbeitet werden.'
                        : status === 'APPROVED'
                          ? 'Der gespeicherte Snapshot wird als geprueft markiert.'
                          : 'Archivierte Kundenberichte sind nur noch lesbar.'}
                  </p>
                  <div className="form-actions">
                    <button
                      className={status === 'APPROVED' ? 'primary-button' : 'secondary-button'}
                      type="submit"
                    >
                      {getStatusActionLabel(status)}
                    </button>
                  </div>
                </form>
              ))}
            </div>
          ) : report.status === 'ARCHIVED' ? (
            <p>Der Bericht ist archiviert und hat keine weitere Statusaktion.</p>
          ) : (
            <p>Fuer Ihre Rolle ist keine Statusaktion verfuegbar.</p>
          )}
        </article>
      </section>

      {canEdit ? (
        <section className="panel report-admin-only">
          <p className="eyebrow">Entwurf bearbeiten</p>
          <h2>Kundenlesbare Felder und interne Notiz aktualisieren</h2>
          <form action={updateCustomerReportAction.bind(null, report.id)} className="form-stack">
            <div className="form-grid">
              <label className="form-field">
                <span>Berichtstyp</span>
                <select defaultValue={report.type} name="type">
                  {customerReportTypes.map((type) => (
                    <option key={type} value={type}>
                      {getCustomerReportTypeLabel(type)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                <span>Empfaenger</span>
                <input defaultValue={report.recipientName} name="recipientName" required />
              </label>
              <label className="form-field full-span">
                <span>Titel</span>
                <input defaultValue={report.title} name="title" required />
              </label>
              <label className="form-field">
                <span>Zeitraum von</span>
                <input
                  defaultValue={toCustomerReportDateInput(report.periodStart)}
                  name="periodStart"
                  type="date"
                />
              </label>
              <label className="form-field">
                <span>Zeitraum bis</span>
                <input
                  defaultValue={toCustomerReportDateInput(report.periodEnd)}
                  name="periodEnd"
                  type="date"
                />
              </label>
              <label className="form-field full-span">
                <span>Anlass / Problemstellung</span>
                <textarea defaultValue={report.issueSummary ?? ''} name="issueSummary" rows={3} />
              </label>
              <label className="form-field">
                <span>Feststellungen</span>
                <textarea defaultValue={report.findingSummary ?? ''} name="findingSummary" rows={4} />
              </label>
              <label className="form-field">
                <span>Ausgefuehrte Arbeiten</span>
                <textarea
                  defaultValue={report.workPerformedSummary ?? ''}
                  name="workPerformedSummary"
                  rows={4}
                />
              </label>
              <label className="form-field">
                <span>Noch erforderliche Arbeiten</span>
                <textarea
                  defaultValue={report.workStillNeededSummary ?? ''}
                  name="workStillNeededSummary"
                  rows={4}
                />
              </label>
              <label className="form-field">
                <span>Folgeaktivitaeten</span>
                <textarea
                  defaultValue={report.followUpSummary ?? ''}
                  name="followUpSummary"
                  rows={4}
                />
              </label>
              <label className="form-field full-span">
                <span>Kostenhinweis</span>
                <textarea
                  defaultValue={report.costSummaryText ?? ''}
                  name="costSummaryText"
                  rows={3}
                />
              </label>
              <label className="form-field full-span internal-note-field">
                <span>Interne Notizen · nur Buero</span>
                <textarea
                  defaultValue={internalNotes ?? ''}
                  name="internalNotes"
                  rows={3}
                />
                <small>
                  Diese Notizen erscheinen weder in der Kundenansicht noch im Browserdruck.
                </small>
              </label>
            </div>
            <p className="muted-note">
              Quellenauswahl und kopierter Kontext bleiben unveraenderlich. Fuer eine andere
              Auswahl muss ein neuer Kundenbericht angelegt werden.
            </p>
            <div className="form-actions">
              <button className="primary-button" type="submit">
                Entwurf speichern
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="panel report-admin-only source-audit-panel">
        <p className="eyebrow">Nur Buero</p>
        <h2>Kopierte Quellen und Originaldateien pruefen</h2>
        <div className="source-warning">
          <strong>Dateiverfuegbarkeit ist nicht Teil des Snapshots</strong>
          <p>
            Der Bericht speichert Nachweis-Metadaten und Referenzen. Das Oeffnen der
            Originaldatei haengt weiterhin vom lokalen Attachment-Speicher ab und kann mit
            einer ehrlichen Nicht-gefunden-Meldung scheitern. Die Kunden-/Druckansicht
            behauptet deshalb keine eingebettete Datei.
          </p>
        </div>

        <div className="content-grid nested-stack">
          <div>
            <h3>Einsatzberichte</h3>
            {jobReports.length > 0 ? (
              <div className="stack-list">
                {jobReports.map((jobReport) => (
                  <div className="stack-item" key={jobReport.id}>
                    <strong>{jobReport.position + 1}. {jobReport.summary}</strong>
                    <p className="compact-text">
                      {getJobReportTypeLabel(jobReport.type)} ·{' '}
                      {getReportReviewStatusLabel(jobReport.reviewStatus)} ·{' '}
                      {formatDateTime(jobReport.createdAt)}
                    </p>
                    <div className="meta-inline">
                      <span>{jobReport.author?.name ?? 'Ohne Autorenangabe'}</span>
                      <span>{jobReport.team?.name ?? 'Ohne Teamkontext'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>Keine Einsatzberichte ausgewaehlt.</p>
            )}
          </div>

          <div>
            <h3>Nachweisreferenzen</h3>
            {attachments.length > 0 ? (
              <div className="stack-list">
                {attachments.map((attachment) => (
                  <div className="stack-item" key={attachment.id}>
                    <strong>{attachment.position + 1}. {attachment.caption ?? attachment.fileName}</strong>
                    <p className="compact-text">
                      {attachment.mimeType} · {formatFileSize(attachment.sizeBytes)} ·{' '}
                      {formatDateTime(attachment.uploadedAt)}
                    </p>
                    <div className="action-row">
                      <a
                        href={getAttachmentProxyUrl(attachment.id)}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Originaldatei oeffnen
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>Keine Nachweise ausgewaehlt.</p>
            )}
          </div>
        </div>

        <div className="nested-stack">
          <h3>Ausgewaehlte Kostendetails</h3>
          {selectedCostLines.length > 0 ? (
            <div className="stack-list">
              {selectedCostLines.map((costLine) => (
                <div className="stack-item" key={costLine.sourceCostLineId}>
                  <div className="row-spread">
                    <strong>{costLine.position + 1}. {costLine.description}</strong>
                    <strong>{formatJobCostMoney(costLine.totalCost, costLine.currency)}</strong>
                  </div>
                  <div className="meta-inline">
                    <span>{getJobCostKindLabel(costLine.kind)}</span>
                    <span>{costLine.quantity} {getJobCostUnitLabel(costLine.unit)}</span>
                    <span>{formatJobCostDate(costLine.costDate)}</span>
                    {costLine.taxRate !== undefined ? (
                      <span>Steuermetadatum: {costLine.taxRate} %</span>
                    ) : null}
                    {costLine.vendorName ? <span>Lieferant: {costLine.vendorName}</span> : null}
                    {costLine.receiptReference ? (
                      <span>Beleg: {costLine.receiptReference}</span>
                    ) : null}
                  </div>
                  {costLine.notes ? <p>{costLine.notes}</p> : null}
                </div>
              ))}
            </div>
          ) : (
            <p>Keine einzelnen Kostenzeilen ausgewaehlt.</p>
          )}
          <p className="muted-note nested-stack">
            Vollstaendige Auftragssumme:{' '}
            {costBreakdown?.fullJobSummary
              ? formatJobCostMoney(
                  costBreakdown.fullJobSummary.grandTotal,
                  costBreakdown.fullJobSummary.currency,
                )
              : 'nicht in den Snapshot aufgenommen'}
            . Kosten sind weder Rechnung noch Steuerberechnung.
          </p>
        </div>
      </section>
    </main>
  );
}
