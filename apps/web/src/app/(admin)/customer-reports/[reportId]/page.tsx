import type { CustomerReportStatus } from '@einsatzpilot/types';
import { customerReportTypes } from '@einsatzpilot/schemas';
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
  const jobReports = [...source.jobReports].sort((left, right) => left.position - right.position);
  const attachments = [...source.attachments].sort(
    (left, right) => left.position - right.position,
  );
  const selectedCostLines = costBreakdown
    ? [...costBreakdown.selectedLines].sort((left, right) => left.position - right.position)
    : [];
  const flashMessage = resolvedSearchParams?.error
    ? { tone: 'error', text: resolvedSearchParams.error }
    : resolvedSearchParams?.notice && noticeLabels[resolvedSearchParams.notice]
      ? { tone: 'success', text: noticeLabels[resolvedSearchParams.notice] }
      : null;

  return (
    <main className="content-page">
      <section className="hero-card">
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
        <section className={`panel flash-banner ${flashMessage.tone}`}>
          <strong>{flashMessage.tone === 'error' ? 'Aktion fehlgeschlagen' : 'Aktion gespeichert'}</strong>
          <p>{flashMessage.text}</p>
        </section>
      ) : null}

      <section className="content-grid">
        <article className="panel">
          <p className="eyebrow">Snapshot-Kontext</p>
          <h2>Kopierte Auftrags- und Stammdaten</h2>
          <dl className="info-list">
            <div>
              <dt>Auftrag</dt>
              <dd>{report.snapshotJobReference} · {report.snapshotJobTitle}</dd>
            </div>
            <div>
              <dt>Kunde</dt>
              <dd>{report.snapshotCustomerName}</dd>
            </div>
            <div>
              <dt>Empfaenger</dt>
              <dd>{report.recipientName}</dd>
            </div>
            <div>
              <dt>Adresse</dt>
              <dd>
                {report.snapshotAddressLabel ? `${report.snapshotAddressLabel}: ` : ''}
                {report.snapshotAddressText}
              </dd>
            </div>
            <div>
              <dt>Objekt</dt>
              <dd>{report.snapshotObjectName ?? 'Kein Objekt im Snapshot'}</dd>
            </div>
            <div>
              <dt>Objektbereich</dt>
              <dd>{report.snapshotObjectAreaName ?? 'Kein Objektbereich im Snapshot'}</dd>
            </div>
            <div>
              <dt>Berichtszeitraum</dt>
              <dd>
                {formatCustomerReportDate(report.periodStart)} bis{' '}
                {formatCustomerReportDate(report.periodEnd)}
              </dd>
            </div>
            <div>
              <dt>Snapshot erstellt</dt>
              <dd>{formatDateTime(source.capturedAt)}</dd>
            </div>
          </dl>
          <p className="muted-note">
            Diese Angaben stammen aus dem gespeicherten Snapshot und werden nicht live aus
            den aktuell bearbeitbaren Stammdaten aufgeloest.
          </p>
        </article>

        <article className="panel">
          <p className="eyebrow">Status</p>
          <h2>Pruefung und Freigabe</h2>
          <p>
            Aktueller Stand: <strong>{getCustomerReportStatusLabel(report.status)}</strong>
          </p>
          {report.approvedBy ? (
            <p>
              Freigegeben von {report.approvedBy.name}
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
        <section className="panel">
          <p className="eyebrow">Entwurf bearbeiten</p>
          <h2>Kundenlesbare Felder aktualisieren</h2>
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
              <label className="form-field full-span">
                <span>Interne Notizen</span>
                <textarea
                  defaultValue={report.internalNotes ?? ''}
                  name="internalNotes"
                  rows={3}
                />
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

      <section className="panel">
        <p className="eyebrow">Berichtstext</p>
        <h2>Gespeicherte Zusammenfassungen</h2>
        <div className="content-grid">
          <div className="stack-list">
            <div className="stack-item">
              <strong>Anlass / Problemstellung</strong>
              <p>{report.issueSummary ?? 'Nicht hinterlegt.'}</p>
            </div>
            <div className="stack-item">
              <strong>Feststellungen</strong>
              <p>{report.findingSummary ?? 'Nicht hinterlegt.'}</p>
            </div>
            <div className="stack-item">
              <strong>Ausgefuehrte Arbeiten</strong>
              <p>{report.workPerformedSummary ?? 'Nicht hinterlegt.'}</p>
            </div>
          </div>
          <div className="stack-list">
            <div className="stack-item">
              <strong>Noch erforderliche Arbeiten</strong>
              <p>{report.workStillNeededSummary ?? 'Nicht hinterlegt.'}</p>
            </div>
            <div className="stack-item">
              <strong>Folgeaktivitaeten</strong>
              <p>{report.followUpSummary ?? 'Nicht hinterlegt.'}</p>
            </div>
            <div className="stack-item">
              <strong>Kostenhinweis</strong>
              <p>{report.costSummaryText ?? 'Nicht hinterlegt.'}</p>
            </div>
          </div>
        </div>
        {report.internalNotes ? (
          <div className="stack-item nested-stack">
            <strong>Interne Notizen</strong>
            <p>{report.internalNotes}</p>
          </div>
        ) : null}
      </section>

      <section className="content-grid">
        <article className="panel">
          <p className="eyebrow">Ausgewaehlte Einsatzberichte</p>
          <h2>{jobReports.length} kopierte Bericht(e)</h2>
          {jobReports.length > 0 ? (
            <div className="stack-list">
              {jobReports.map((jobReport) => (
                <div className="stack-item" key={jobReport.id}>
                  <div className="row-spread">
                    <strong>{jobReport.summary}</strong>
                    <span className="inline-chip">Position {jobReport.position}</span>
                  </div>
                  <p className="compact-text">
                    {getJobReportTypeLabel(jobReport.type)} ·{' '}
                    {getReportReviewStatusLabel(jobReport.reviewStatus)} ·{' '}
                    {formatDateTime(jobReport.createdAt)}
                  </p>
                  <div className="meta-inline">
                    <span>{jobReport.author?.name ?? 'Ohne Autorenangabe'}</span>
                    <span>{jobReport.team?.name ?? 'Ohne Teamkontext'}</span>
                  </div>
                  {jobReport.findingSummary ? <p>Feststellung: {jobReport.findingSummary}</p> : null}
                  {jobReport.workPerformed ? <p>Arbeiten: {jobReport.workPerformed}</p> : null}
                  {jobReport.workStillNeeded ? <p>Noch offen: {jobReport.workStillNeeded}</p> : null}
                  {jobReport.followUpRequired ? (
                    <p>Folgeaktion: {jobReport.followUpNotes ?? 'Erforderlich'}</p>
                  ) : null}
                  {jobReport.details ? <p>{jobReport.details}</p> : null}
                </div>
              ))}
            </div>
          ) : (
            <p>In diesem Snapshot wurden keine Einsatzberichte ausgewaehlt.</p>
          )}
        </article>

        <article className="panel">
          <p className="eyebrow">Ausgewaehlte Nachweise</p>
          <h2>{attachments.length} kopierte Datei(en)</h2>
          {attachments.length > 0 ? (
            <div className="stack-list">
              {attachments.map((attachment) => (
                <div className="stack-item" key={attachment.id}>
                  <div className="row-spread">
                    <strong>{attachment.caption ?? attachment.fileName}</strong>
                    <span className="inline-chip">Position {attachment.position}</span>
                  </div>
                  {attachment.kind === 'PHOTO' ? (
                    <a href={getAttachmentProxyUrl(attachment.id)} target="_blank" rel="noreferrer">
                      <img
                        className="proof-image"
                        src={getAttachmentProxyUrl(attachment.id)}
                        alt={attachment.caption ?? attachment.fileName}
                      />
                    </a>
                  ) : null}
                  <div className="meta-inline">
                    <span>{attachment.mimeType}</span>
                    <span>{formatFileSize(attachment.sizeBytes)}</span>
                    <span>{formatDateTime(attachment.uploadedAt)}</span>
                  </div>
                  <div className="action-row">
                    <a href={getAttachmentProxyUrl(attachment.id)} target="_blank" rel="noreferrer">
                      Nachweis oeffnen
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>In diesem Snapshot wurden keine Nachweise ausgewaehlt.</p>
          )}
        </article>
      </section>

      <section className="content-grid">
        <article className="panel">
          <p className="eyebrow">Ausgewaehlte Kosten</p>
          <h2>Kopierte Kostenzeilen</h2>
          {costBreakdown ? (
            <>
              <p>
                Ausgewaehlte Summe:{' '}
                <strong>
                  {formatJobCostMoney(
                    costBreakdown.selectedLineSummary.grandTotal,
                    costBreakdown.selectedLineSummary.currency,
                  )}
                </strong>
              </p>
              {selectedCostLines.length > 0 ? (
                <div className="stack-list">
                  {selectedCostLines.map((costLine) => (
                    <div className="stack-item" key={costLine.sourceCostLineId}>
                      <div className="row-spread">
                        <strong>{costLine.description}</strong>
                        <strong>{formatJobCostMoney(costLine.totalCost, costLine.currency)}</strong>
                      </div>
                      <div className="meta-inline">
                        <span>{getJobCostKindLabel(costLine.kind)}</span>
                        <span>
                          {costLine.quantity} {getJobCostUnitLabel(costLine.unit)}
                        </span>
                        <span>
                          Einzelkosten:{' '}
                          {costLine.unitCost === undefined
                            ? 'manueller Gesamtbetrag'
                            : formatJobCostMoney(costLine.unitCost, costLine.currency)}
                        </span>
                        <span>{formatJobCostDate(costLine.costDate)}</span>
                        {costLine.item ? (
                          <span>{costLine.item.customId} · {costLine.item.name}</span>
                        ) : null}
                        {costLine.taxRate !== undefined ? (
                          <span>Steuermetadatum: {costLine.taxRate} %</span>
                        ) : null}
                        {costLine.vendorName ? <span>{costLine.vendorName}</span> : null}
                        {costLine.receiptReference ? (
                          <span>Beleg: {costLine.receiptReference}</span>
                        ) : null}
                      </div>
                      {costLine.notes ? <p>{costLine.notes}</p> : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p>Es wurden keine einzelnen Kostenzeilen ausgewaehlt.</p>
              )}
            </>
          ) : (
            <p>Dieser Snapshot enthaelt keine Kostendaten.</p>
          )}
        </article>

        <article className="panel">
          <p className="eyebrow">Vollstaendige Kostenuebersicht</p>
          <h2>Backend-berechneter Snapshot</h2>
          {costBreakdown?.fullJobSummary ? (
            <dl className="info-list">
              <div>
                <dt>Material</dt>
                <dd>{formatJobCostMoney(costBreakdown.fullJobSummary.materialTotal, costBreakdown.fullJobSummary.currency)}</dd>
              </div>
              <div>
                <dt>Arbeitszeit</dt>
                <dd>{formatJobCostMoney(costBreakdown.fullJobSummary.laborTotal, costBreakdown.fullJobSummary.currency)}</dd>
              </div>
              <div>
                <dt>Fahrt</dt>
                <dd>{formatJobCostMoney(costBreakdown.fullJobSummary.travelTotal, costBreakdown.fullJobSummary.currency)}</dd>
              </div>
              <div>
                <dt>Fremdleistung</dt>
                <dd>{formatJobCostMoney(costBreakdown.fullJobSummary.externalServiceTotal, costBreakdown.fullJobSummary.currency)}</dd>
              </div>
              <div>
                <dt>Sonstiges</dt>
                <dd>{formatJobCostMoney(costBreakdown.fullJobSummary.otherTotal, costBreakdown.fullJobSummary.currency)}</dd>
              </div>
              <div>
                <dt>Gesamt</dt>
                <dd><strong>{formatJobCostMoney(costBreakdown.fullJobSummary.grandTotal, costBreakdown.fullJobSummary.currency)}</strong></dd>
              </div>
            </dl>
          ) : (
            <p>Die vollstaendige Auftragssumme wurde nicht in diesen Snapshot aufgenommen.</p>
          )}
          <p className="muted-note">
            Kostenwerte sind kopierte Auftragsdaten und weder Rechnung noch Steuerberechnung.
          </p>
        </article>
      </section>
    </main>
  );
}
