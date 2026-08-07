import type {
  CustomerReportSnapshotItem,
  JobCostSummary,
} from '@einsatzpilot/types';

import {
  formatJobCostMoney,
  getJobCostKindLabel,
  getJobCostUnitLabel,
} from '../../../lib/job-costs';
import {
  formatFileSize,
  getJobReportTypeLabel,
} from '../../../lib/reports';
import {
  formatCustomerReportDate,
  getCustomerReportStatusLabel,
  getCustomerReportStatusTone,
  getCustomerReportTypeLabel,
} from '../../../lib/customer-reports';

export type CustomerReportPresentationData = Omit<
  CustomerReportSnapshotItem,
  'internalNotes' | 'createdBy' | 'approvedBy'
>;

function formatDocumentDate(value?: string) {
  if (!value) {
    return 'Nicht gesetzt';
  }

  return new Intl.DateTimeFormat('de-DE').format(new Date(value));
}

function CostSummaryTable({ summary }: { summary: JobCostSummary }) {
  const rows = [
    ['Material', summary.materialTotal],
    ['Arbeitszeit', summary.laborTotal],
    ['Fahrt', summary.travelTotal],
    ['Fremdleistung', summary.externalServiceTotal],
    ['Sonstiges', summary.otherTotal],
  ] as const;

  return (
    <div className="report-cost-summary">
      {rows.map(([label, amount]) => (
        <div key={label}>
          <span>{label}</span>
          <strong>{formatJobCostMoney(amount, summary.currency)}</strong>
        </div>
      ))}
      <div className="report-cost-total">
        <span>Gesamt</span>
        <strong>{formatJobCostMoney(summary.grandTotal, summary.currency)}</strong>
      </div>
    </div>
  );
}

function ReportTextSection({
  title,
  value,
}: {
  title: string;
  value?: string;
}) {
  if (!value) {
    return null;
  }

  return (
    <section className="customer-report-section report-text-section">
      <h2>{title}</h2>
      <p>{value}</p>
    </section>
  );
}

export function CustomerReportDocument({
  report,
}: {
  report: CustomerReportPresentationData;
}) {
  // Customer-visible rendering boundary: every value below comes from this persisted
  // CustomerReportSnapshot response. Do not resolve live Job, directory, report, cost,
  // or attachment records in this component.
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
  const hasSummaryText = Boolean(
    report.issueSummary ||
      report.findingSummary ||
      report.workPerformedSummary ||
      report.workStillNeededSummary ||
      report.followUpSummary,
  );

  return (
    <article className="customer-report-document" data-customer-report-print>
      <header className="customer-report-document-header">
        <div>
          <p className="report-document-kicker">
            {getCustomerReportTypeLabel(report.type)}
          </p>
          <h1>{report.title}</h1>
          <p className="report-document-number">Bericht {report.reportNumber}</p>
        </div>
        <div className="report-document-status">
          <span
            className={`status-pill ${getCustomerReportStatusTone(report.status)}`}
          >
            {getCustomerReportStatusLabel(report.status)}
          </span>
          {!report.approvedAt ? (
            <small>Dieser Stand ist noch kein freigegebener Kundenbericht.</small>
          ) : null}
        </div>
      </header>

      <section className="customer-report-section report-context-section">
        <h2>Empfaenger und Auftragskontext</h2>
        <dl className="report-context-grid">
          <div>
            <dt>Empfaenger</dt>
            <dd>{report.recipientName}</dd>
          </div>
          <div>
            <dt>Kunde</dt>
            <dd>{report.snapshotCustomerName}</dd>
          </div>
          <div>
            <dt>Objekt</dt>
            <dd>
              {report.snapshotObjectName ?? 'Ohne Objektbezug'}
              {report.snapshotObjectAreaName
                ? ` · ${report.snapshotObjectAreaName}`
                : ''}
            </dd>
          </div>
          <div>
            <dt>Adresse</dt>
            <dd>
              {report.snapshotAddressLabel
                ? `${report.snapshotAddressLabel}: `
                : ''}
              {report.snapshotAddressText}
            </dd>
          </div>
          <div>
            <dt>Auftrag</dt>
            <dd>
              {report.snapshotJobReference} · {report.snapshotJobTitle}
            </dd>
          </div>
          <div>
            <dt>Berichtszeitraum</dt>
            <dd>
              {formatCustomerReportDate(report.periodStart)} bis{' '}
              {formatCustomerReportDate(report.periodEnd)}
            </dd>
          </div>
        </dl>
      </section>

      {hasSummaryText ? (
        <div className="report-text-grid">
          <ReportTextSection
            title="Anlass / Problemstellung"
            value={report.issueSummary}
          />
          <ReportTextSection title="Feststellungen" value={report.findingSummary} />
          <ReportTextSection
            title="Ausgefuehrte Arbeiten"
            value={report.workPerformedSummary}
          />
          <ReportTextSection
            title="Noch erforderliche Arbeiten"
            value={report.workStillNeededSummary}
          />
          <ReportTextSection
            title="Folgeaktivitaeten / naechste Schritte"
            value={report.followUpSummary}
          />
        </div>
      ) : (
        <section className="customer-report-section report-empty-section">
          <h2>Berichtszusammenfassung</h2>
          <p>In diesem Snapshot sind noch keine kundenlesbaren Zusammenfassungen hinterlegt.</p>
        </section>
      )}

      {jobReports.length > 0 ? (
        <section className="customer-report-section">
          <div className="report-section-heading">
            <div>
              <p className="report-section-number">01</p>
              <h2>Dokumentierte Einsatzberichte</h2>
            </div>
            <span>{jobReports.length} Nachweis(e)</span>
          </div>
          <div className="report-source-list">
            {jobReports.map((jobReport) => (
              <article className="report-source-entry" key={jobReport.id}>
                <p className="report-source-meta">
                  {getJobReportTypeLabel(jobReport.type)} ·{' '}
                  {formatDocumentDate(jobReport.createdAt)}
                </p>
                <h3>{jobReport.summary}</h3>
                {jobReport.findingSummary ? (
                  <p><strong>Feststellung:</strong> {jobReport.findingSummary}</p>
                ) : null}
                {jobReport.workPerformed ? (
                  <p><strong>Ausgefuehrte Arbeiten:</strong> {jobReport.workPerformed}</p>
                ) : null}
                {jobReport.workStillNeeded ? (
                  <p><strong>Noch erforderlich:</strong> {jobReport.workStillNeeded}</p>
                ) : null}
                {jobReport.followUpRequired ? (
                  <p>
                    <strong>Folgeaktivitaet:</strong>{' '}
                    {jobReport.followUpNotes ?? 'Erforderlich'}
                  </p>
                ) : null}
                {jobReport.details ? <p>{jobReport.details}</p> : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="customer-report-section">
        <div className="report-section-heading">
          <div>
            <p className="report-section-number">02</p>
            <h2>Nachweisreferenzen</h2>
          </div>
          <span>{attachments.length} Referenz(en)</span>
        </div>
        {attachments.length > 0 ? (
          <ol className="report-evidence-list">
            {attachments.map((attachment) => (
              <li key={attachment.id}>
                <div>
                  <strong>{attachment.caption ?? attachment.fileName}</strong>
                  <span>{attachment.fileName}</span>
                </div>
                <span>
                  {attachment.kind === 'PHOTO' ? 'Foto' : 'Datei'} ·{' '}
                  {formatFileSize(attachment.sizeBytes)} ·{' '}
                  {formatDocumentDate(attachment.uploadedAt)}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p>Dieser Snapshot enthaelt keine Nachweisreferenzen.</p>
        )}
      </section>

      {costBreakdown || report.costSummaryText ? (
        <section className="customer-report-section">
          <div className="report-section-heading">
            <div>
              <p className="report-section-number">03</p>
              <h2>Kostenuebersicht</h2>
            </div>
            {report.snapshotCostGrandTotal !== undefined && report.snapshotCostCurrency ? (
              <strong className="report-grand-total">
                {formatJobCostMoney(
                  report.snapshotCostGrandTotal,
                  report.snapshotCostCurrency,
                )}
              </strong>
            ) : null}
          </div>
          {report.costSummaryText ? (
            <p className="report-cost-note">{report.costSummaryText}</p>
          ) : null}
          {selectedCostLines.length > 0 ? (
            <div className="report-cost-lines">
              <div className="report-cost-line report-cost-line-header">
                <span>Position</span>
                <span>Menge</span>
                <span>Betrag</span>
              </div>
              {selectedCostLines.map((costLine) => (
                <div className="report-cost-line" key={costLine.sourceCostLineId}>
                  <span>
                    <strong>{costLine.description}</strong>
                    <small>{getJobCostKindLabel(costLine.kind)}</small>
                  </span>
                  <span>
                    {costLine.quantity} {getJobCostUnitLabel(costLine.unit)}
                  </span>
                  <strong>{formatJobCostMoney(costLine.totalCost, costLine.currency)}</strong>
                </div>
              ))}
            </div>
          ) : null}
          {costBreakdown?.fullJobSummary ? (
            <div className="report-full-cost-summary">
              <h3>Vollstaendige Auftragssumme im Snapshot</h3>
              <CostSummaryTable summary={costBreakdown.fullJobSummary} />
            </div>
          ) : costBreakdown?.selectedLineSummary ? (
            <div className="report-full-cost-summary">
              <h3>Summe der ausgewaehlten Positionen</h3>
              <CostSummaryTable summary={costBreakdown.selectedLineSummary} />
            </div>
          ) : null}
        </section>
      ) : null}

      <footer className="customer-report-document-footer">
        <div>
          <strong>{report.reportNumber}</strong>
          <span>Erstellt am {formatDocumentDate(report.createdAt)}</span>
        </div>
        <div>
          <strong>{getCustomerReportStatusLabel(report.status)}</strong>
          {report.approvedAt ? (
            <span>Freigegeben am {formatDocumentDate(report.approvedAt)}</span>
          ) : (
            <span>Noch ohne Freigabe</span>
          )}
        </div>
      </footer>
    </article>
  );
}
