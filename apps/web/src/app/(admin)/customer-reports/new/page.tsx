import { customerReportTypes } from '@einsatzpilot/schemas';
import Link from 'next/link';

import { createCustomerReportAction } from '../../../../lib/customer-report-actions';
import {
  getCustomerReportSourceData,
  getCustomerReportTypeLabel,
  toCustomerReportDateInput,
} from '../../../../lib/customer-reports';
import { requireServerSession } from '../../../../lib/server-auth';
import { CustomerReportSourcePicker } from '../customer-report-source-picker';

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

  return (
    <main className="content-page">
      <section className="hero-card">
        <p className="eyebrow">Neuer Kundenbericht</p>
        <h1>Bericht fuer {source.job.reference} vorbereiten</h1>
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

      <section className="creation-steps" aria-label="Ablauf der Berichtserstellung">
        <div>
          <span>1</span>
          <strong>Kontext pruefen</strong>
          <small>Auftrag, Empfaenger und Objekt</small>
        </div>
        <div>
          <span>2</span>
          <strong>Quellen auswaehlen</strong>
          <small>Berichte, Nachweise und Kosten</small>
        </div>
        <div>
          <span>3</span>
          <strong>Snapshot anlegen</strong>
          <small>Danach bleiben Quellen unveraenderlich</small>
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
              <label className="form-field full-span internal-note-field">
                <span>Interne Notizen · nur Buero</span>
                <textarea name="internalNotes" rows={3} />
                <small>
                  Diese Notizen erscheinen weder in der Kundenansicht noch im Browserdruck.
                </small>
              </label>
            </div>
          </section>

          <CustomerReportSourcePicker source={source} />

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
