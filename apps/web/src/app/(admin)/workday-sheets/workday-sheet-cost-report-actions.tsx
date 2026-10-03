import type {
  WorkdaySheetDetail,
  WorkdaySheetOptionsResponse,
  WorkdaySheetRowItem,
} from '@einsatzpilot/types';

import {
  createJobCostLineFromWorksheetRowAction,
  createJobReportFromWorksheetRowAction,
} from '../../../lib/workday-sheet-actions';

function targetJobId(row: WorkdaySheetRowItem) {
  return (
    row.jobId ??
    row.reviewActions.find((action) => action.type === 'CREATE_FOLLOW_UP_JOB')
      ?.destinationJob.id ??
    ''
  );
}

function sourceText(row: WorkdaySheetRowItem) {
  return row.actualText ?? row.plannedText;
}

function shortText(prefix: string, row: WorkdaySheetRowItem, maxLength: number) {
  const value = `${prefix}${sourceText(row)}`;
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 3)}...`;
}

function SourcePreview({ row }: { row: WorkdaySheetRowItem }) {
  return (
    <div className="worksheet-action-source-preview">
      <strong>Quellvorschau</strong>
      <p>Geplant: {row.plannedText}</p>
      <p>Ausgeführt: {row.actualText ?? 'Keine Ausführung dokumentiert'}</p>
    </div>
  );
}

function TargetJobField({
  options,
  row,
}: {
  options: WorkdaySheetOptionsResponse;
  row: WorkdaySheetRowItem;
}) {
  return (
    <label className="form-field full-span">
      <span>Zielauftrag</span>
      <select defaultValue={targetJobId(row)} name="targetJobId" required>
        <option value="">Auftrag auswählen</option>
        {options.jobs.map((job) => (
          <option key={job.id} value={job.id}>
            {job.reference} · {job.title}
          </option>
        ))}
      </select>
      <small>
        Kosten und Berichte bleiben im bestehenden Auftragsmodell. Ein verknüpfter oder zuvor
        erstellter Folgeauftrag ist vorausgewählt.
      </small>
    </label>
  );
}

export function WorkdaySheetCostActionForm({
  sheet,
  row,
  options,
}: {
  sheet: WorkdaySheetDetail;
  row: WorkdaySheetRowItem;
  options: WorkdaySheetOptionsResponse;
}) {
  return (
    <details className="worksheet-review-action worksheet-screen-only">
      <summary>Kostenzeile aus dieser Zeile erfassen</summary>
      <div className="worksheet-review-action-body">
        <SourcePreview row={row} />
        <form
          action={createJobCostLineFromWorksheetRowAction.bind(null, sheet.id, row.id)}
          className="form-stack"
        >
          <div className="form-grid">
            <TargetJobField options={options} row={row} />
            <label className="form-field">
              <span>Kostenart</span>
              <select defaultValue="OTHER" name="kind">
                <option value="MATERIAL_PURCHASE">Materialeinkauf</option>
                <option value="MATERIAL_USED">Materialverbrauch</option>
                <option value="LABOR">Arbeitszeit</option>
                <option value="TRAVEL">Fahrt</option>
                <option value="EXTERNAL_SERVICE">Fremdleistung</option>
                <option value="FEE">Gebühr</option>
                <option value="OTHER">Sonstige Kosten</option>
              </select>
            </label>
            <label className="form-field">
              <span>Artikel (optional)</span>
              <select defaultValue="" name="itemId">
                <option value="">Kein Artikel</option>
                {options.items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.customId} · {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field full-span">
              <span>Beschreibung</span>
              <input
                defaultValue={shortText('', row, 240)}
                maxLength={240}
                name="description"
                required
              />
            </label>
            <label className="form-field">
              <span>Menge</span>
              <input defaultValue="1" min="0.001" name="quantity" required step="0.001" type="number" />
            </label>
            <label className="form-field">
              <span>Einheit</span>
              <select defaultValue="FLAT_RATE" name="unit">
                <option value="PIECE">Stück</option>
                <option value="HOUR">Stunde</option>
                <option value="KILOMETER">Kilometer</option>
                <option value="KG">Kilogramm</option>
                <option value="LITER">Liter</option>
                <option value="METER">Meter</option>
                <option value="SQUARE_METER">Quadratmeter</option>
                <option value="CUBIC_METER">Kubikmeter</option>
                <option value="FLAT_RATE">Pauschale</option>
                <option value="OTHER">Sonstige</option>
              </select>
            </label>
            <label className="form-field">
              <span>Einzelpreis (optional)</span>
              <input min="0" name="unitCost" step="0.01" type="number" />
            </label>
            <label className="form-field">
              <span>Manueller Gesamtbetrag (optional)</span>
              <input min="0" name="totalCost" step="0.01" type="number" />
            </label>
            <label className="form-field">
              <span>Währung</span>
              <input defaultValue="EUR" maxLength={3} name="currency" required />
            </label>
            <label className="form-field">
              <span>Kostendatum</span>
              <input defaultValue={sheet.date} name="costDate" type="date" />
            </label>
            <label className="form-field">
              <span>Steuersatz % (optional)</span>
              <input max="100" min="0" name="taxRate" step="0.01" type="number" />
            </label>
            <label className="form-field">
              <span>Lieferant (optional)</span>
              <input maxLength={200} name="vendorName" />
            </label>
            <label className="form-field">
              <span>Belegreferenz (optional)</span>
              <input maxLength={120} name="receiptReference" />
            </label>
            <label className="form-field full-span">
              <span>Notizen (optional)</span>
              <textarea name="notes" rows={2} />
            </label>
          </div>
          <p className="muted-note">
            Material, Arbeitszeit und Fahrt benötigen einen Einzelpreis; Fremdleistung, Gebühr
            und Sonstiges können stattdessen einen manuellen Gesamtbetrag verwenden.
          </p>
          <div className="form-actions">
            <button className="primary-button" type="submit">
              Kostenzeile verbindlich erstellen
            </button>
          </div>
        </form>
      </div>
    </details>
  );
}

export function WorkdaySheetReportActionForm({
  sheet,
  row,
  options,
}: {
  sheet: WorkdaySheetDetail;
  row: WorkdaySheetRowItem;
  options: WorkdaySheetOptionsResponse;
}) {
  return (
    <details className="worksheet-review-action worksheet-screen-only">
      <summary>Strukturierten Auftragsbericht erstellen</summary>
      <div className="worksheet-review-action-body">
        <SourcePreview row={row} />
        <form
          action={createJobReportFromWorksheetRowAction.bind(null, sheet.id, row.id)}
          className="form-stack"
        >
          <div className="form-grid">
            <TargetJobField options={options} row={row} />
            <label className="form-field">
              <span>Berichtstyp</span>
              <select defaultValue="WORKER_FINDING" name="type">
                <option value="WORKER_FINDING">Feststellung</option>
                <option value="WORK_COMPLETION">Arbeitsnachweis</option>
                <option value="INCIDENT_REPORT">Störungsbericht</option>
                <option value="FOLLOW_UP_REQUEST">Folgebedarf</option>
              </select>
            </label>
            <label className="form-field">
              <span>Team (optional)</span>
              <select defaultValue="" name="teamId">
                <option value="">Auftragsteam übernehmen</option>
                {options.teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field full-span">
              <span>Kurzfassung</span>
              <input defaultValue={shortText('Tageszettel: ', row, 240)} name="summary" required />
            </label>
            <label className="form-field full-span">
              <span>Details (optional)</span>
              <textarea
                defaultValue={`Geplant: ${row.plannedText}\n\nAusgeführt: ${row.actualText ?? ''}`}
                name="details"
                rows={4}
              />
            </label>
            <label className="form-field full-span">
              <span>Feststellung</span>
              <textarea defaultValue={sourceText(row)} name="findingSummary" rows={3} />
            </label>
            <label className="form-field full-span">
              <span>Ausgeführte Arbeit (optional)</span>
              <textarea defaultValue={row.actualText ?? ''} name="workPerformed" rows={3} />
            </label>
            <label className="form-field full-span">
              <span>Noch erforderlich (optional)</span>
              <textarea name="workStillNeeded" rows={3} />
            </label>
            <label className="checkbox-field full-span">
              <input name="followUpRequired" type="checkbox" />
              <span>Weiterer Handlungsbedarf besteht</span>
            </label>
            <label className="form-field full-span">
              <span>Hinweis zum Folgebedarf (optional)</span>
              <textarea name="followUpNotes" rows={2} />
            </label>
          </div>
          <p className="muted-note">
            Der Bericht wird im bestehenden Prüfstatus „Ausstehende Prüfung“ angelegt und folgt
            danach dem normalen Auftragsbericht-Workflow.
          </p>
          <div className="form-actions">
            <button className="primary-button" type="submit">
              Auftragsbericht verbindlich erstellen
            </button>
          </div>
        </form>
      </div>
    </details>
  );
}
