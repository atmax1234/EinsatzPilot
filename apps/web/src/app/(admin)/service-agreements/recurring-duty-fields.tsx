import type { RecurringObjectDutyItem } from '@einsatzpilot/types';

export function RecurringDutyFields({
  duty,
  defaultFirstDueDate,
}: {
  duty?: RecurringObjectDutyItem;
  defaultFirstDueDate?: string;
}) {
  return (
    <div className="form-grid">
      <label className="form-field full-span">
        <span>Wiederkehrender Plantext</span>
        <textarea
          defaultValue={duty?.plannedText ?? ''}
          name="plannedText"
          placeholder="Treppenhaus und Hauseingang reinigen"
          required
          rows={3}
        />
      </label>
      <label className="form-field">
        <span>Rhythmus</span>
        <select defaultValue={duty?.cadenceUnit ?? 'WEEK'} name="cadenceUnit">
          <option value="DAY">Tag</option>
          <option value="WEEK">Woche</option>
          <option value="MONTH">Monat</option>
          <option value="YEAR">Jahr</option>
        </select>
      </label>
      <label className="form-field">
        <span>Alle</span>
        <input
          defaultValue={duty?.cadenceInterval ?? 1}
          max="999"
          min="1"
          name="cadenceInterval"
          required
          type="number"
        />
      </label>
      <label className="form-field">
        <span>Erste Fälligkeit</span>
        <input
          defaultValue={duty?.firstDueDate ?? defaultFirstDueDate ?? ''}
          name="firstDueDate"
          required
          type="date"
        />
      </label>
      <label className="form-field">
        <span>Aktiv</span>
        <span className="checkbox-field">
          <input defaultChecked={duty?.isActive ?? true} name="isActive" type="checkbox" />
          <span>Für spätere Planung berücksichtigen</span>
        </span>
      </label>
      <label className="form-field">
        <span>Beginn (optional)</span>
        <input defaultValue={duty?.startTime ?? ''} name="startTime" type="time" />
      </label>
      <label className="form-field">
        <span>Ende (optional)</span>
        <input defaultValue={duty?.endTime ?? ''} name="endTime" type="time" />
      </label>
      <label className="form-field full-span">
        <span>Interner Planungshinweis (optional)</span>
        <textarea defaultValue={duty?.notes ?? ''} name="notes" rows={2} />
      </label>
    </div>
  );
}
