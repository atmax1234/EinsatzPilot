import Link from 'next/link';

import type { WorkdaySheetRowItem } from '@einsatzpilot/types';

function rowTime(row: WorkdaySheetRowItem) {
  if (!row.startTime) return 'Flexible Uhrzeit';
  return `${row.startTime}${row.endTime ? `–${row.endTime}` : ''} Uhr`;
}

export function WorkdaySheetRowSummary({
  row,
  rowNumber,
  showActual = true,
}: {
  row: WorkdaySheetRowItem;
  rowNumber: number;
  showActual?: boolean;
}) {
  return (
    <div className="worksheet-row-summary">
      <div className="row-spread">
        <div>
          <p className="eyebrow">Zeile {rowNumber}</p>
          <h3>{rowTime(row)}</h3>
        </div>
        <span className={`status-pill ${row.actualText ? 'done' : ''}`}>
          {row.actualText ? 'Erledigt' : 'Noch offen'}
        </span>
      </div>

      <div className="worksheet-plan-text">
        <strong>Geplant</strong>
        <p>{row.plannedText}</p>
        {row.notes ? <p className="muted-note">Hinweis: {row.notes}</p> : null}
      </div>

      {row.customer || row.address || row.object || row.objectArea || row.job ? (
        <div className="worksheet-context-list" aria-label="Verknüpfungen">
          {row.customer ? (
            <span className="context-chip">Kunde: {row.customer.name}</span>
          ) : null}
          {row.address ? (
            <span className="context-chip">
              Adresse: {row.address.label} · {row.address.street}, {row.address.city}
            </span>
          ) : null}
          {row.object ? <span className="context-chip">Objekt: {row.object.name}</span> : null}
          {row.objectArea ? (
            <span className="context-chip">Bereich: {row.objectArea.name}</span>
          ) : null}
          {row.job ? (
            <Link className="context-chip context-link" href={`/jobs/${row.job.id}`}>
              Auftrag: {row.job.reference} · {row.job.title}
            </Link>
          ) : null}
        </div>
      ) : null}

      {showActual ? (
        <div className={`worksheet-actual-text ${row.actualText ? 'complete' : ''}`}>
          <strong>Erledigt / tatsächlich ausgeführt</strong>
          <p>{row.actualText ?? 'Noch keine Ausführung erfasst.'}</p>
        </div>
      ) : null}
    </div>
  );
}
