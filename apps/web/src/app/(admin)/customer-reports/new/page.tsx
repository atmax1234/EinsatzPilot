import { customerReportTypes } from '@einsatzpilot/schemas';
import Link from 'next/link';

import { createCustomerReportAction } from '../../../../lib/customer-report-actions';
import {
  getCustomerReportSourceData,
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

export default async function NewCustomerReportPage({
  searchParams,
}: {
  searchParams?: Promise<{ jobId?: string; error?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const jobId = resolvedSearchParams?.jobId;
  const session = await requireServerSession();
  const canCreate =
    session.membershipRole === 'OWNER' || session.membershipRole === 'OFFICE';

  if (!jobId) {
    return (
      <main className="content-page">
        <section className="panel flash-banner error">
          <strong>Ein Auftrag ist erforderlich.</strong>
          <p>Starte den Kundenbericht aus einem Auftragsdetail oder waehle einen Auftrag aus.</p>
          <div className="action-row">
            <Link href="/jobs">Zu den Auftraegen</Link>
            <Link href="/customer-reports">Zu den Kundenberichten</Link>
          </div>
        </section>
      </main>
    );
  }

  const sourceResult = await getCustomerReportSourceData(jobId);
  const source = sourceResult.data;

  if (!sourceResult.ok || !source) {
    return (
      <main className="content-page">
        <section className="panel flash-banner error">
          <strong>Quelldaten konnten nicht geladen werden.</strong>
          <p>{sourceResult.error ?? 'Die API hat keine gueltige Antwort geliefert.'}</p>
          <div className="action-row">
            <Link href={`/jobs/${jobId}`}>Zum Auftrag</Link>
            <Link href="/customer-reports">Zu den Kundenberichten</Link>
          </div>
        </section>
      </main>
    );
  }

  const selectableReports = source.jobReports.filter((report) => report.selectable);
  const selectableAttachments = source.attachments.filter((attachment) => attachment.selectable);

  return (
    <main className="content-page">
      <section className="hero-card">
        <p className="eyebrow">Neuer Kundenbericht</p>
        <h1>Snapshot fuer {source.job.reference} anlegen</h1>
        <p>
          {source.job.title} · {source.customer?.name ?? source.job.customerName} ·{' '}
          {source.address
            ? `${source.address.street}, ${source.address.postalCode} ${source.address.city}`
            : source.job.location}
        </p>
        <div className="action-row">
          <Link href={`/jobs/${jobId}`}>Zum Auftrag</Link>
          <Link href="/customer-reports">Zu den Kundenberichten</Link>
        </div>
      </section>

      {resolvedSearchParams?.error ? (
        <section className="panel flash-banner error">
          <strong>Kundenbericht konnte nicht angelegt werden.</strong>
          <p>{resolvedSearchParams.error}</p>
        </section>
      ) : null}

      {!canCreate ? (
        <section className="panel flash-banner error">
          <strong>Keine Schreibberechtigung.</strong>
          <p>Nur Owner und Office duerfen Kundenberichte anlegen.</p>
        </section>
      ) : (
        <form action={createCustomerReportAction.bind(null, jobId)} className="form-stack">
          <section className="content-grid">
            <article className="panel">
              <p className="eyebrow">Berichtsdaten</p>
              <h2>Titel und Empfaenger</h2>
              <div className="form-grid">
                <label className="form-field">
                  <span>Berichtstyp</span>
                  <select defaultValue="JOB_COMPLETION" name="type">
                    {customerReportTypes.map((type) => (
                      <option key={type} value={type}>
                        {getCustomerReportTypeLabel(type)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form-field">
                  <span>Empfaenger</span>
                  <input
                    defaultValue={source.customer?.name ?? source.job.customerName}
                    name="recipientName"
                    required
                  />
                </label>
                <label className="form-field full-span">
                  <span>Titel</span>
                  <input
                    defaultValue={`Kundenbericht ${source.job.reference}`}
                    name="title"
                    required
                  />
                </label>
                <label className="form-field">
                  <span>Zeitraum von</span>
                  <input
                    defaultValue={toCustomerReportDateInput(source.job.scheduledStart)}
                    name="periodStart"
                    type="date"
                  />
                </label>
                <label className="form-field">
                  <span>Zeitraum bis</span>
                  <input
                    defaultValue={toCustomerReportDateInput(
                      source.job.scheduledEnd ?? source.job.scheduledStart,
                    )}
                    name="periodEnd"
                    type="date"
                  />
                </label>
              </div>
            </article>

            <article className="panel">
              <p className="eyebrow">Kopierter Kontext</p>
              <h2>Quelle dieses Snapshots</h2>
              <dl className="info-list">
                <div>
                  <dt>Auftrag</dt>
                  <dd>{source.job.reference} · {source.job.title}</dd>
                </div>
                <div>
                  <dt>Kunde</dt>
                  <dd>{source.customer?.name ?? `${source.job.customerName} (Freitext)`}</dd>
                </div>
                <div>
                  <dt>Adresse</dt>
                  <dd>
                    {source.address
                      ? `${source.address.label}: ${source.address.street}, ${source.address.postalCode} ${source.address.city}, ${source.address.country}`
                      : `${source.job.location} (Freitext)`}
                  </dd>
                </div>
                <div>
                  <dt>Objekt</dt>
                  <dd>{source.object?.name ?? 'Kein Objekt verknuepft'}</dd>
                </div>
                <div>
                  <dt>Objektbereich</dt>
                  <dd>{source.objectArea?.name ?? 'Kein Objektbereich verknuepft'}</dd>
                </div>
              </dl>
              <p className="muted-note">
                Diese Werte werden beim Anlegen kopiert. Spaetere Aenderungen am Auftrag oder
                an Stammdaten veraendern den Kundenbericht nicht.
              </p>
            </article>
          </section>

          <section className="panel">
            <p className="eyebrow">Inhalte</p>
            <h2>Kundenlesbare Zusammenfassungen</h2>
            <div className="form-grid">
              <label className="form-field full-span">
                <span>Anlass / Problemstellung</span>
                <textarea name="issueSummary" rows={3} />
              </label>
              <label className="form-field">
                <span>Feststellungen</span>
                <textarea name="findingSummary" rows={4} />
              </label>
              <label className="form-field">
                <span>Ausgefuehrte Arbeiten</span>
                <textarea name="workPerformedSummary" rows={4} />
              </label>
              <label className="form-field">
                <span>Noch erforderliche Arbeiten</span>
                <textarea name="workStillNeededSummary" rows={4} />
              </label>
              <label className="form-field">
                <span>Folgeaktivitaeten</span>
                <textarea name="followUpSummary" rows={4} />
              </label>
              <label className="form-field full-span">
                <span>Kostenhinweis</span>
                <textarea name="costSummaryText" rows={3} />
              </label>
              <label className="form-field full-span">
                <span>Interne Notizen</span>
                <textarea name="internalNotes" rows={3} />
              </label>
            </div>
          </section>

          <section className="content-grid">
            <article className="panel">
              <p className="eyebrow">Ausgewaehlte Einsatzberichte</p>
              <h2>Nur freigegebene Berichte kopieren</h2>
              {source.jobReports.length > 0 ? (
                <div className="stack-list">
                  {source.jobReports.map((report) => (
                    <div className="stack-item" key={report.id}>
                      <label className="checkbox-field">
                        <input
                          disabled={!report.selectable}
                          name="selectedJobReportIds"
                          type="checkbox"
                          value={report.id}
                        />
                        <div>
                          <strong>{report.summary}</strong>
                          <p className="compact-text">
                            {getJobReportTypeLabel(report.type)} ·{' '}
                            {getReportReviewStatusLabel(report.reviewStatus)} ·{' '}
                            {formatDateTime(report.createdAt)}
                          </p>
                          {!report.selectable ? (
                            <p className="compact-text">Nicht zur Snapshot-Auswahl freigegeben.</p>
                          ) : null}
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <p>Zu diesem Auftrag gibt es noch keine Einsatzberichte.</p>
              )}
              <p className="muted-note">
                {selectableReports.length} Bericht(e) sind durch das Backend auswaehlbar.
              </p>
            </article>

            <article className="panel">
              <p className="eyebrow">Ausgewaehlte Nachweise</p>
              <h2>Fotos und Dateien kopieren</h2>
              {source.attachments.length > 0 ? (
                <div className="stack-list">
                  {source.attachments.map((attachment) => (
                    <div className="stack-item" key={attachment.id}>
                      <label className="checkbox-field">
                        <input
                          disabled={!attachment.selectable}
                          name="selectedAttachmentIds"
                          type="checkbox"
                          value={attachment.id}
                        />
                        <div>
                          <strong>{attachment.caption ?? attachment.fileName}</strong>
                          <p className="compact-text">
                            {attachment.kind === 'PHOTO' ? 'Foto' : 'Datei'} ·{' '}
                            {formatFileSize(attachment.sizeBytes)} ·{' '}
                            {formatDateTime(attachment.uploadedAt)}
                          </p>
                        </div>
                      </label>
                      <div className="action-row">
                        <a href={getAttachmentProxyUrl(attachment.id)} target="_blank" rel="noreferrer">
                          Nachweis oeffnen
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>Zu diesem Auftrag wurden noch keine Nachweise hochgeladen.</p>
              )}
              <p className="muted-note">
                {selectableAttachments.length} Nachweis(e) sind durch das Backend auswaehlbar.
              </p>
            </article>
          </section>

          <section className="panel">
            <p className="eyebrow">Kosten</p>
            <h2>Kostenzeilen explizit auswaehlen</h2>
            <p>
              Aktuelle Gesamtsumme:{' '}
              <strong>
                {formatJobCostMoney(source.costSummary.grandTotal, source.costSummary.currency)}
              </strong>
            </p>
            {source.costLines.length > 0 ? (
              <div className="stack-list">
                {source.costLines.map((costLine) => (
                  <div className="stack-item" key={costLine.id}>
                    <label className="checkbox-field">
                      <input
                        name="selectedCostLineIds"
                        type="checkbox"
                        value={costLine.id}
                      />
                      <div>
                        <strong>
                          {costLine.description} ·{' '}
                          {formatJobCostMoney(costLine.totalCost, costLine.currency)}
                        </strong>
                        <p className="compact-text">
                          {getJobCostKindLabel(costLine.kind)} · {costLine.quantity}{' '}
                          {getJobCostUnitLabel(costLine.unit)} ·{' '}
                          {formatJobCostDate(costLine.costDate)}
                        </p>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <p>Zu diesem Auftrag gibt es noch keine Kostenzeilen.</p>
            )}
            <label className="form-field checkbox-field nested-stack">
              <input name="includeFullCostSummary" type="checkbox" />
              <span>Zusatzlich die vollstaendige backend-berechnete Auftragssumme kopieren</span>
            </label>
            <p className="muted-note">
              Die Auswahl erzeugt Kostensnapshot-Daten, aber keine Rechnung oder
              Steuerberechnung.
            </p>
          </section>

          <section className="panel">
            <div className="form-actions">
              <button className="primary-button" type="submit">
                Entwurf als Snapshot anlegen
              </button>
              <Link className="secondary-link" href={`/jobs/${jobId}`}>
                Abbrechen
              </Link>
            </div>
          </section>
        </form>
      )}
    </main>
  );
}
