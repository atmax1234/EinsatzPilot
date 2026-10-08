import { createWorkerFindingAction } from '../../../lib/worker-actions';

type WorkerFindingFormProps = {
  jobId: string;
  returnTo: string;
  contextLabel?: string;
  compact?: boolean;
};

export function WorkerFindingForm({
  jobId,
  returnTo,
  contextLabel,
  compact = false,
}: WorkerFindingFormProps) {
  const form = (
    <form action={createWorkerFindingAction.bind(null, jobId)} className="form-stack worker-finding-form">
      <input name="returnTo" type="hidden" value={returnTo} />
      {contextLabel ? <p className="worker-finding-context">Bezug: {contextLabel}</p> : null}
      <label className="form-field">
        <span>Kurzfassung</span>
        <input
          name="summary"
          placeholder="z. B. Eingangstür schließt nicht"
          required
        />
      </label>
      <label className="form-field">
        <span>Feststellung</span>
        <textarea
          name="findingSummary"
          placeholder="Was ist vor Ort aufgefallen? Bitte konkret beschreiben."
          required
          rows={compact ? 4 : 5}
        />
      </label>
      <label className="form-field">
        <span>Foto oder Video (optional)</span>
        <input accept="image/*,video/*" capture="environment" name="file" type="file" />
        <small>Der Nachweis wird am Auftrag und am Fund gespeichert, nicht am Tageszettel.</small>
      </label>
      <label className="form-field checkbox-field">
        <input defaultChecked name="followUpRequired" type="checkbox" />
        <span>Office soll eine Folgeaktion prüfen</span>
      </label>
      <label className="form-field">
        <span>Hinweis an das Office (optional)</span>
        <textarea
          name="followUpNotes"
          placeholder="z. B. Verwaltung informieren oder Fachfirma beauftragen"
          rows={3}
        />
      </label>
      <div className="form-actions">
        <button className="primary-button worker-primary-action" type="submit">
          Fund senden
        </button>
      </div>
    </form>
  );

  if (!compact) return form;

  return (
    <details className="worker-finding-disclosure">
      <summary>Problem oder Fund melden</summary>
      <div className="worker-finding-disclosure-body">{form}</div>
    </details>
  );
}
