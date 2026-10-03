import type {
  WorkdaySheetDetail,
  WorkdaySheetOptionsResponse,
  WorkdaySheetRowItem,
} from '@einsatzpilot/types';

import { createFollowUpJobFromWorksheetRowAction } from '../../../lib/workday-sheet-actions';

function defaultTitle(row: WorkdaySheetRowItem) {
  const source = row.actualText ?? row.plannedText;
  const title = `Folgeauftrag: ${source}`;
  return title.length <= 200 ? title : `${title.slice(0, 197)}...`;
}

function defaultLocation(row: WorkdaySheetRowItem) {
  if (row.address) {
    return `${row.address.label}, ${row.address.street}, ${row.address.postalCode} ${row.address.city}`;
  }
  return row.object?.name ?? '';
}

function defaultDescription(sheet: WorkdaySheetDetail, row: WorkdaySheetRowItem) {
  return [
    `Quelle: Tageszettel ${sheet.date}, Zeile ${row.position + 1}`,
    `Geplant: ${row.plannedText}`,
    `Ausgeführt: ${row.actualText ?? 'Keine Ausführung dokumentiert'}`,
  ].join('\n\n');
}

export function WorkdaySheetFollowUpJobForm({
  sheet,
  row,
  options,
}: {
  sheet: WorkdaySheetDetail;
  row: WorkdaySheetRowItem;
  options: WorkdaySheetOptionsResponse;
}) {
  return (
    <div className="worksheet-follow-up-action worksheet-screen-only">
      <div>
        <p className="eyebrow">Explizite Prüfaktion</p>
        <h3>Folgeauftrag aus dieser Zeile</h3>
        <p className="muted-note">
          Quelle und Ziel werden dauerhaft protokolliert. Die Tageszettel-Zeile bleibt unverändert.
        </p>
      </div>
      <form
        action={createFollowUpJobFromWorksheetRowAction.bind(null, sheet.id, row.id)}
        className="form-stack"
      >
        <div className="form-grid">
          <label className="form-field full-span">
            <span>Auftragstitel</span>
            <input defaultValue={defaultTitle(row)} maxLength={200} name="title" required />
          </label>
          <label className="form-field full-span">
            <span>Beschreibung</span>
            <textarea defaultValue={defaultDescription(sheet, row)} name="description" rows={5} />
          </label>
          <label className="form-field">
            <span>Kundenname</span>
            <input defaultValue={row.customer?.name ?? ''} name="customerName" required />
          </label>
          <label className="form-field">
            <span>Einsatzort</span>
            <input defaultValue={defaultLocation(row)} name="location" required />
          </label>
          <label className="form-field">
            <span>Geplanter Beginn</span>
            <input name="scheduledStart" required type="datetime-local" />
          </label>
          <label className="form-field">
            <span>Geplantes Ende (optional)</span>
            <input name="scheduledEnd" type="datetime-local" />
          </label>
          <label className="form-field">
            <span>Priorität</span>
            <select defaultValue="NORMAL" name="priority">
              <option value="LOW">Niedrig</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">Hoch</option>
              <option value="URGENT">Dringend</option>
            </select>
          </label>
          <label className="form-field">
            <span>Team (optional)</span>
            <select defaultValue={sheet.teamId ?? ''} name="teamId">
              <option value="">Kein Team</option>
              {options.teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Kundenverknüpfung (optional)</span>
            <select defaultValue={row.customerId ?? ''} name="customerId">
              <option value="">Keine Verknüpfung</option>
              {options.customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Adressverknüpfung (optional)</span>
            <select defaultValue={row.addressId ?? ''} name="addressId">
              <option value="">Keine Verknüpfung</option>
              {options.addresses.map((address) => (
                <option key={address.id} value={address.id}>
                  {address.label} · {address.street}, {address.city}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Objektverknüpfung (optional)</span>
            <select defaultValue={row.objectId ?? ''} name="objectId">
              <option value="">Keine Verknüpfung</option>
              {options.objects.map((object) => (
                <option key={object.id} value={object.id}>
                  {object.name}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Objektbereich (optional)</span>
            <select defaultValue={row.objectAreaId ?? ''} name="objectAreaId">
              <option value="">Keine Verknüpfung</option>
              {options.objectAreas.map((area) => {
                const objectName = options.objects.find((object) => object.id === area.objectId)?.name;
                return (
                  <option key={area.id} value={area.id}>
                    {objectName ? `${objectName} · ` : ''}{area.name}
                  </option>
                );
              })}
            </select>
          </label>
        </div>
        <div className="form-actions">
          <button className="primary-button" type="submit">
            Folgeauftrag verbindlich erstellen
          </button>
        </div>
      </form>
    </div>
  );
}
