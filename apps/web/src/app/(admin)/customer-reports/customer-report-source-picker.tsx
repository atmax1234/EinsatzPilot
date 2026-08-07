'use client';

import type {
  CustomerReportSourceDataResponse,
  JobCostKind,
  JobCostUnit,
  JobReportType,
  ReportReviewStatus,
} from '@einsatzpilot/types';
import { useState } from 'react';

function reportTypeLabel(type: JobReportType) {
  return {
    GENERAL: 'Allgemeiner Bericht',
    WORKER_FINDING: 'Worker-Fund',
    WORK_COMPLETION: 'Arbeitsabschluss',
    INCIDENT_REPORT: 'Stoerungsbericht',
    FOLLOW_UP_REQUEST: 'Folgeauftrag angefragt',
  }[type];
}

function reviewStatusLabel(status: ReportReviewStatus) {
  return {
    SUBMITTED: 'Eingereicht',
    PENDING_REVIEW: 'Pruefung offen',
    APPROVED: 'Freigegeben',
    NEEDS_REVISION: 'Ueberarbeitung erforderlich',
    REJECTED: 'Abgelehnt',
  }[status];
}

function costKindLabel(kind: JobCostKind) {
  return {
    MATERIAL_PURCHASE: 'Materialeinkauf',
    MATERIAL_USED: 'Materialverbrauch',
    LABOR: 'Arbeitszeit',
    TRAVEL: 'Fahrtkosten',
    EXTERNAL_SERVICE: 'Fremdleistung',
    FEE: 'Gebuehr',
    OTHER: 'Sonstige Kosten',
  }[kind];
}

function costUnitLabel(unit: JobCostUnit) {
  return {
    PIECE: 'Stueck',
    HOUR: 'Stunde',
    KILOMETER: 'Kilometer',
    KG: 'kg',
    LITER: 'Liter',
    METER: 'Meter',
    SQUARE_METER: 'Quadratmeter',
    CUBIC_METER: 'Kubikmeter',
    FLAT_RATE: 'Pauschal',
    OTHER: 'Andere Einheit',
  }[unit];
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('de-DE').format(new Date(value));
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency,
  }).format(amount);
}

function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  const kiloBytes = sizeBytes / 1024;
  return kiloBytes < 1024
    ? `${kiloBytes.toFixed(1)} KB`
    : `${(kiloBytes / 1024).toFixed(1)} MB`;
}

function toggleSelection(
  current: string[],
  value: string,
  selected: boolean,
) {
  return selected ? [...current, value] : current.filter((entry) => entry !== value);
}

function selectionNames(values: string[]) {
  return values.length > 0 ? values.join(', ') : 'Noch keine Auswahl';
}

export function CustomerReportSourcePicker({
  source,
}: {
  source: CustomerReportSourceDataResponse;
}) {
  const [selectedReportIds, setSelectedReportIds] = useState<string[]>([]);
  const [selectedAttachmentIds, setSelectedAttachmentIds] = useState<string[]>([]);
  const [selectedCostLineIds, setSelectedCostLineIds] = useState<string[]>([]);
  const [includeFullCostSummary, setIncludeFullCostSummary] = useState(false);
  const selectedReports = source.jobReports.filter((report) =>
    selectedReportIds.includes(report.id),
  );
  const selectedAttachments = source.attachments.filter((attachment) =>
    selectedAttachmentIds.includes(attachment.id),
  );
  const selectedCostLines = source.costLines.filter((costLine) =>
    selectedCostLineIds.includes(costLine.id),
  );

  return (
    <>
      <section className="content-grid">
        <article className="panel source-selection-panel">
          <p className="eyebrow">Einsatzberichte</p>
          <h2>Freigegebene Berichte auswaehlen</h2>
          <p>
            Nur durch das Backend als <strong>freigegeben</strong> markierte Berichte
            koennen Bestandteil des Snapshots werden. Die hier angezeigte Reihenfolge
            wird im Snapshot gespeichert.
          </p>
          {source.jobReports.length > 0 ? (
            <div className="stack-list">
              {source.jobReports.map((report) => {
                const reason = report.selectable
                  ? 'Auswaehlbar: Dieser Einsatzbericht ist freigegeben.'
                  : `Nicht auswaehlbar: Status ${reviewStatusLabel(report.reviewStatus)}. Nur freigegebene Berichte sind fuer Kundenberichte zulaessig.`;

                return (
                  <div
                    className={`stack-item source-option ${report.selectable ? '' : 'source-option-disabled'}`}
                    key={report.id}
                  >
                    <label className="checkbox-field">
                      <input
                        checked={selectedReportIds.includes(report.id)}
                        disabled={!report.selectable}
                        name="selectedJobReportIds"
                        onChange={(event) =>
                          setSelectedReportIds((current) =>
                            toggleSelection(current, report.id, event.target.checked),
                          )
                        }
                        type="checkbox"
                        value={report.id}
                      />
                      <div>
                        <strong>{report.summary}</strong>
                        <p className="compact-text">
                          {reportTypeLabel(report.type)} · {reviewStatusLabel(report.reviewStatus)} ·{' '}
                          {formatDate(report.createdAt)}
                        </p>
                        <p className="source-eligibility">{reason}</p>
                      </div>
                    </label>
                  </div>
                );
              })}
            </div>
          ) : (
            <p>Zu diesem Auftrag gibt es noch keine Einsatzberichte.</p>
          )}
        </article>

        <article className="panel source-selection-panel">
          <p className="eyebrow">Nachweise</p>
          <h2>Fotos und Dateien referenzieren</h2>
          <p>
            Der Snapshot speichert Beschreibung, Dateiname, Typ, Groesse und Referenz.
            Die Datei selbst wird nicht in den Kundenbericht kopiert.
          </p>
          {source.attachments.length > 0 ? (
            <div className="stack-list">
              {source.attachments.map((attachment) => (
                <div
                  className={`stack-item source-option ${attachment.selectable ? '' : 'source-option-disabled'}`}
                  key={attachment.id}
                >
                  <label className="checkbox-field">
                    <input
                      checked={selectedAttachmentIds.includes(attachment.id)}
                      disabled={!attachment.selectable}
                      name="selectedAttachmentIds"
                      onChange={(event) =>
                        setSelectedAttachmentIds((current) =>
                          toggleSelection(current, attachment.id, event.target.checked),
                        )
                      }
                      type="checkbox"
                      value={attachment.id}
                    />
                    <div>
                      <strong>{attachment.caption ?? attachment.fileName}</strong>
                      <p className="compact-text">
                        {attachment.kind === 'PHOTO' ? 'Foto' : 'Datei'} ·{' '}
                        {formatFileSize(attachment.sizeBytes)} · {formatDate(attachment.uploadedAt)}
                      </p>
                    </div>
                  </label>
                  <div className="action-row">
                    <a
                      href={`/api/attachments/${attachment.id}/file`}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Originaldatei pruefen
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>Zu diesem Auftrag wurden noch keine Nachweise hochgeladen.</p>
          )}
          <div className="source-warning">
            <strong>Hinweis fuer das Buero</strong>
            <p>
              Originaldateien liegen derzeit im lokalen Attachment-Speicher. Eine
              spaetere Verfuegbarkeit wird durch die gespeicherte Referenz nicht garantiert.
            </p>
          </div>
        </article>
      </section>

      <section className="panel source-selection-panel">
        <p className="eyebrow">Kostenumfang</p>
        <h2>Detailzeilen und Gesamtuebersicht bewusst trennen</h2>
        <div className="scope-explainer-grid">
          <div className="scope-explainer">
            <strong>Ausgewaehlte Kostenzeilen</strong>
            <p>
              Kopieren die einzelnen Positionen mit Beschreibung, Menge, Einheit und Betrag
              in den Snapshot. Nur diese Positionen erscheinen als Detailzeilen.
            </p>
          </div>
          <div className="scope-explainer">
            <strong>Vollstaendige Auftragssumme</strong>
            <p>
              Kopiert zusaetzlich die aktuelle backend-berechnete Gruppensumme des gesamten
              Auftrags. Nicht ausgewaehlte Positionen werden dabei nicht als Details kopiert.
            </p>
          </div>
        </div>
        <p>
          Aktuelle Auftragssumme:{' '}
          <strong>{formatMoney(source.costSummary.grandTotal, source.costSummary.currency)}</strong>
          {' '}aus {source.costSummary.lineCount} Kostenzeile(n).
        </p>
        {source.costLines.length > 0 ? (
          <div className="stack-list">
            {source.costLines.map((costLine) => (
              <div className="stack-item source-option" key={costLine.id}>
                <label className="checkbox-field">
                  <input
                    checked={selectedCostLineIds.includes(costLine.id)}
                    name="selectedCostLineIds"
                    onChange={(event) =>
                      setSelectedCostLineIds((current) =>
                        toggleSelection(current, costLine.id, event.target.checked),
                      )
                    }
                    type="checkbox"
                    value={costLine.id}
                  />
                  <div>
                    <strong>
                      {costLine.description} · {formatMoney(costLine.totalCost, costLine.currency)}
                    </strong>
                    <p className="compact-text">
                      {costKindLabel(costLine.kind)} · {costLine.quantity}{' '}
                      {costUnitLabel(costLine.unit)} · {formatDate(costLine.costDate)}
                    </p>
                  </div>
                </label>
              </div>
            ))}
          </div>
        ) : (
          <p>Zu diesem Auftrag gibt es noch keine Kostenzeilen.</p>
        )}
        <label className="form-field checkbox-field full-summary-choice">
          <input
            checked={includeFullCostSummary}
            name="includeFullCostSummary"
            onChange={(event) => setIncludeFullCostSummary(event.target.checked)}
            type="checkbox"
          />
          <span>Vollstaendige backend-berechnete Auftragssumme in den Snapshot kopieren</span>
        </label>
        <p className="muted-note">
          Kostensnapshot-Daten sind weder Rechnung noch Steuerberechnung.
        </p>
      </section>

      <section className="panel selection-summary-panel">
        <div className="row-spread selection-summary-heading">
          <div>
            <p className="eyebrow">Erstellungsuebersicht</p>
            <h2>Das wird in den Snapshot kopiert</h2>
          </div>
          <span className="inline-chip">Unveraenderlich nach Erstellung</span>
        </div>
        <div className="selection-summary-grid">
          <div>
            <strong>{selectedReports.length}</strong>
            <span>freigegebene Einsatzberichte</span>
            <small>{selectionNames(selectedReports.map((report) => report.summary))}</small>
          </div>
          <div>
            <strong>{selectedAttachments.length}</strong>
            <span>Nachweisreferenzen</span>
            <small>
              {selectionNames(
                selectedAttachments.map(
                  (attachment) => attachment.caption ?? attachment.fileName,
                ),
              )}
            </small>
          </div>
          <div>
            <strong>{selectedCostLines.length}</strong>
            <span>ausgewaehlte Kostenzeilen</span>
            <small>Die API berechnet deren Snapshot-Summe beim Anlegen.</small>
          </div>
          <div>
            <strong>{includeFullCostSummary ? 'Ja' : 'Nein'}</strong>
            <span>vollstaendige Auftragssumme</span>
            <small>
              {includeFullCostSummary
                ? formatMoney(source.costSummary.grandTotal, source.costSummary.currency)
                : 'Keine Gesamtuebersicht ausgewaehlt'}
            </small>
          </div>
        </div>
        <p className="muted-note">
          Zusaetzlich werden der oben gezeigte Auftrags-, Kunden-, Adress- und Objektkontext
          sowie die ausgefuellten Berichtstexte gespeichert. Die API prueft die Auswahl beim
          Anlegen erneut.
        </p>
      </section>
    </>
  );
}
