import type {
  JobCostKind,
  JobCostUnit,
  JobEditableStatus,
  JobStatus,
} from '@einsatzpilot/types';

import { notFound } from 'next/navigation';

import {
  createJobReportAction,
  reviewJobReportAction,
  transitionJobStatusAction,
  updateJobAction,
  uploadJobAttachmentAction,
} from '../../../../lib/admin-actions';
import { getStatusTone } from '../../../../lib/admin-mvp';
import {
  createJobCostAction,
  updateJobCostAction,
} from '../../../../lib/job-cost-actions';
import {
  formatJobCostDate,
  formatJobCostMoney,
  getJobCostKindLabel,
  getJobCostUnitLabel,
  getJobCostsData,
  toDateInputValue,
} from '../../../../lib/job-costs';
import { getItemsData } from '../../../../lib/items';
import {
  formatDateTime,
  getJobDetailData,
  getJobPriorityLabel,
  getJobRelationOptionsData,
  getJobStatusLabel,
  getTeamsData,
  toDateTimeLocalValue,
} from '../../../../lib/operations';
import {
  formatFileSize,
  getAttachmentKindLabel,
  getAttachmentProxyUrl,
  getJobReportTypeLabel,
  getReportReviewStatusLabel,
  isReportAwaitingReview,
} from '../../../../lib/reports';
import { requireServerSession } from '../../../../lib/server-auth';

const jobDetailNoticeLabels: Record<string, string> = {
  'job-created': 'Der neue Auftrag ist gespeichert und steht jetzt fuer weitere Bearbeitung bereit.',
  'job-updated': 'Die Auftragsdaten wurden aktualisiert.',
  'job-status-updated': 'Der Statuswechsel wurde uebernommen und im Aktivitaetslog dokumentiert.',
  'report-created': 'Der Bericht wurde direkt am Auftrag erfasst.',
  'report-reviewed': 'Die Berichtspruefung wurde gespeichert und im Aktivitaetslog dokumentiert.',
  'attachment-uploaded': 'Der Nachweis wurde am Auftrag hinterlegt.',
  'cost-created': 'Die Kostenzeile wurde am Auftrag erfasst.',
  'cost-updated': 'Die Kostenzeile wurde aktualisiert.',
};

const jobCostKinds = [
  'MATERIAL_PURCHASE',
  'MATERIAL_USED',
  'LABOR',
  'TRAVEL',
  'EXTERNAL_SERVICE',
  'FEE',
  'OTHER',
] as const satisfies readonly JobCostKind[];

const jobCostUnits = [
  'PIECE',
  'HOUR',
  'KILOMETER',
  'KG',
  'LITER',
  'METER',
  'SQUARE_METER',
  'CUBIC_METER',
  'FLAT_RATE',
  'OTHER',
] as const satisfies readonly JobCostUnit[];

const jobStatusTargets: Record<JobStatus, JobEditableStatus[]> = {
  PLANNED: ['IN_PROGRESS', 'CANCELED'],
  IN_PROGRESS: ['DONE', 'CANCELED'],
  DONE: ['PLANNED'],
  CANCELED: [],
};

function getAllowedStatusTargets(status: JobStatus): JobEditableStatus[] {
  return jobStatusTargets[status];
}

export default async function JobDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ jobId: string }>;
  searchParams?: Promise<{ notice?: string; error?: string }>;
}) {
  const session = await requireServerSession();

  const { jobId } = await params;
  const [
    jobResult,
    teamsResult,
    relationOptionsResult,
    jobCostsResult,
    itemsResult,
    resolvedSearchParams,
  ] = await Promise.all([
    getJobDetailData(jobId),
    getTeamsData(),
    getJobRelationOptionsData(),
    getJobCostsData(jobId),
    getItemsData(),
    searchParams,
  ]);

  if (!jobResult.ok || !jobResult.data) {
    notFound();
  }

  const job = jobResult.data.job;
  const relationOptions = relationOptionsResult.ok ? relationOptionsResult.data : undefined;
  const objectNames = new Map(
    relationOptions?.objects.map((object) => [object.id, object.name]) ?? [],
  );
  const reports = job.reports ?? [];
  const attachments = job.attachments ?? [];
  const photoAttachments = attachments.filter((attachment) => attachment.kind === 'PHOTO');
  const fileAttachments = attachments.filter((attachment) => attachment.kind === 'FILE');
  const allowedStatusTargets = getAllowedStatusTargets(job.status);
  const canReviewReports =
    session.membershipRole === 'OWNER' || session.membershipRole === 'OFFICE';
  const canWriteCosts =
    session.membershipRole === 'OWNER' || session.membershipRole === 'OFFICE';
  const jobCosts = jobCostsResult.ok ? jobCostsResult.data : undefined;
  const itemOptions = itemsResult.ok ? itemsResult.data?.items ?? [] : [];
  const flashMessage = resolvedSearchParams?.error
    ? {
        tone: 'error' as const,
        text: resolvedSearchParams.error,
      }
    : resolvedSearchParams?.notice && jobDetailNoticeLabels[resolvedSearchParams.notice]
      ? {
          tone: 'success' as const,
          text: jobDetailNoticeLabels[resolvedSearchParams.notice],
        }
      : null;

  return (
    <main className="content-page">
      <section className="hero-card">
        <p className="eyebrow">Auftragsdetail</p>
        <h1>{job.title}</h1>
        <p>
          {job.reference} · {job.customerName} · {job.location}
        </p>
        <div className="detail-meta">
          <span className={`status-pill ${getStatusTone(job.status)}`}>
            {getJobStatusLabel(job.status)}
          </span>
          <span className="inline-chip">{getJobPriorityLabel(job.priority)}</span>
          <span className="inline-chip">{formatDateTime(job.scheduledStart)}</span>
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
          <p className="eyebrow">Beschreibung</p>
          <h2>Einsatzkontext</h2>
          <p>{job.description ?? 'Noch keine Zusatzbeschreibung vorhanden.'}</p>
          <dl className="info-list">
            <div>
              <dt>Zugewiesenes Team</dt>
              <dd>{job.assignedTeam?.name ?? 'Noch nicht zugewiesen'}</dd>
            </div>
            <div>
              <dt>Geplanter Abschluss</dt>
              <dd>{job.scheduledEnd ? formatDateTime(job.scheduledEnd) : 'Noch offen'}</dd>
            </div>
            <div>
              <dt>Verknuepfter Kunde</dt>
              <dd>{job.customer?.name ?? 'Keine Stammdatenverknuepfung'}</dd>
            </div>
            <div>
              <dt>Verknuepfte Adresse</dt>
              <dd>
                {job.address
                  ? `${job.address.label}: ${job.address.street}, ${job.address.postalCode} ${job.address.city}`
                  : 'Keine Stammdatenverknuepfung'}
              </dd>
            </div>
            <div>
              <dt>Verknuepftes Objekt</dt>
              <dd>{job.object?.name ?? 'Keine Stammdatenverknuepfung'}</dd>
            </div>
            <div>
              <dt>Verknuepfter Objektbereich</dt>
              <dd>{job.objectArea?.name ?? 'Keine Stammdatenverknuepfung'}</dd>
            </div>
          </dl>
        </article>

        <article className="panel">
          <p className="eyebrow">Disposition</p>
          <h2>Auftrag bearbeiten</h2>
          <form action={updateJobAction.bind(null, job.id)} className="form-stack">
            <div className="form-grid">
              <label className="form-field full-span">
                <span>Titel</span>
                <input defaultValue={job.title} name="title" required />
              </label>

              <label className="form-field">
                <span>Kunde</span>
                <input defaultValue={job.customerName} name="customerName" required />
              </label>

              <label className="form-field">
                <span>Ort</span>
                <input defaultValue={job.location} name="location" required />
              </label>

              <p className="muted-note full-span">
                Stammdatenverknuepfungen sind optional. Die freien Felder Kunde und Ort bleiben
                unabhaengig erhalten.
              </p>

              {relationOptions ? (
                <>
                  <label className="form-field">
                    <span>Kundenverknuepfung</span>
                    <select defaultValue={job.customerId ?? ''} name="customerId">
                      <option value="">Ohne Kundenverknuepfung</option>
                      {relationOptions.customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="form-field">
                    <span>Adressverknuepfung</span>
                    <select defaultValue={job.addressId ?? ''} name="addressId">
                      <option value="">Ohne Adressverknuepfung</option>
                      {relationOptions.addresses.map((address) => (
                        <option key={address.id} value={address.id}>
                          {address.label}: {address.street}, {address.postalCode} {address.city}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="form-field">
                    <span>Objektverknuepfung</span>
                    <select defaultValue={job.objectId ?? ''} name="objectId">
                      <option value="">Ohne Objektverknuepfung</option>
                      {relationOptions.objects.map((object) => (
                        <option key={object.id} value={object.id}>
                          {object.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="form-field">
                    <span>Objektbereich</span>
                    <select defaultValue={job.objectAreaId ?? ''} name="objectAreaId">
                      <option value="">Ohne Objektbereich</option>
                      {relationOptions.objectAreas.map((area) => (
                        <option key={area.id} value={area.id}>
                          {objectNames.get(area.objectId) ?? 'Objekt'} / {area.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              ) : (
                <>
                  <input name="customerId" type="hidden" value={job.customerId ?? ''} />
                  <input name="addressId" type="hidden" value={job.addressId ?? ''} />
                  <input name="objectId" type="hidden" value={job.objectId ?? ''} />
                  <input name="objectAreaId" type="hidden" value={job.objectAreaId ?? ''} />
                </>
              )}

              <label className="form-field">
                <span>Start</span>
                <input
                  defaultValue={toDateTimeLocalValue(job.scheduledStart)}
                  name="scheduledStart"
                  type="datetime-local"
                  required
                />
              </label>

              <label className="form-field">
                <span>Geplantes Ende</span>
                <input
                  defaultValue={toDateTimeLocalValue(job.scheduledEnd)}
                  name="scheduledEnd"
                  type="datetime-local"
                />
              </label>

              <label className="form-field">
                <span>Prioritaet</span>
                <select defaultValue={job.priority} name="priority">
                  <option value="LOW">Niedrig</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">Hoch</option>
                  <option value="URGENT">Dringend</option>
                </select>
              </label>

              <label className="form-field">
                <span>Team</span>
                <select defaultValue={job.assignedTeam?.id ?? ''} name="teamId">
                  <option value="">Noch nicht zuweisen</option>
                  {teamsResult.ok && teamsResult.data
                    ? teamsResult.data.teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))
                    : null}
                </select>
              </label>

              <label className="form-field full-span">
                <span>Beschreibung</span>
                <textarea defaultValue={job.description ?? ''} name="description" rows={5} />
              </label>
            </div>

            {!teamsResult.ok ? (
              <p className="muted-note">
                Teams konnten nicht geladen werden. Die vorhandene Zuweisung bleibt sichtbar,
                neue Auswahl ist gerade aber nicht verfuegbar.
              </p>
            ) : null}

            {!relationOptionsResult.ok ? (
              <p className="muted-note">
                Stammdaten konnten gerade nicht geladen werden. Bestehende Verknuepfungen bleiben
                beim Speichern erhalten.
              </p>
            ) : null}

            <div className="form-actions">
              <button className="primary-button" type="submit">
                Aenderungen speichern
              </button>
            </div>
          </form>
        </article>
      </section>

      <section className="content-grid">
        <article className="panel">
          <p className="eyebrow">Kostenuebersicht</p>
          <h2>Kosten zum Auftrag</h2>
          {jobCosts ? (
            <>
              <dl className="info-list">
                <div>
                  <dt>Material</dt>
                  <dd>{formatJobCostMoney(jobCosts.summary.materialTotal, jobCosts.summary.currency)}</dd>
                </div>
                <div>
                  <dt>Arbeitszeit</dt>
                  <dd>{formatJobCostMoney(jobCosts.summary.laborTotal, jobCosts.summary.currency)}</dd>
                </div>
                <div>
                  <dt>Fahrt</dt>
                  <dd>{formatJobCostMoney(jobCosts.summary.travelTotal, jobCosts.summary.currency)}</dd>
                </div>
                <div>
                  <dt>Fremdleistung</dt>
                  <dd>
                    {formatJobCostMoney(
                      jobCosts.summary.externalServiceTotal,
                      jobCosts.summary.currency,
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Sonstiges</dt>
                  <dd>{formatJobCostMoney(jobCosts.summary.otherTotal, jobCosts.summary.currency)}</dd>
                </div>
                <div>
                  <dt>Gesamt</dt>
                  <dd>
                    <strong>
                      {formatJobCostMoney(jobCosts.summary.grandTotal, jobCosts.summary.currency)}
                    </strong>
                  </dd>
                </div>
              </dl>
              <p className="muted-note">
                {jobCosts.summary.lineCount} Kostenzeile(n). Die Summen werden vom Backend
                berechnet und sind vorbereitende Kostendaten, keine Rechnung.
              </p>
            </>
          ) : (
            <p>
              Kosten konnten nicht geladen werden: {jobCostsResult.error ?? 'Unbekannter Fehler'}
            </p>
          )}
        </article>

        <article className="panel">
          <p className="eyebrow">Kosten erfassen</p>
          <h2>Neue Kostenzeile</h2>
          {canWriteCosts ? (
            <form action={createJobCostAction.bind(null, job.id)} className="form-stack">
              <div className="form-grid">
                <label className="form-field">
                  <span>Kostenart</span>
                  <select defaultValue="MATERIAL_PURCHASE" name="kind">
                    {jobCostKinds.map((kind) => (
                      <option key={kind} value={kind}>
                        {getJobCostKindLabel(kind)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="form-field">
                  <span>Artikelbezug</span>
                  <select defaultValue="" name="itemId">
                    <option value="">Ohne Artikelbezug</option>
                    {itemOptions.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.customId} · {item.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="form-field full-span">
                  <span>Beschreibung</span>
                  <input name="description" required />
                </label>

                <label className="form-field">
                  <span>Menge</span>
                  <input defaultValue="1" min="0.001" name="quantity" step="0.001" type="number" required />
                </label>

                <label className="form-field">
                  <span>Einheit</span>
                  <select defaultValue="PIECE" name="unit">
                    {jobCostUnits.map((unit) => (
                      <option key={unit} value={unit}>
                        {getJobCostUnitLabel(unit)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="form-field">
                  <span>Einzelkosten</span>
                  <input min="0" name="unitCost" step="0.01" type="number" />
                </label>

                <label className="form-field">
                  <span>Manueller Gesamtbetrag</span>
                  <input min="0" name="totalCost" step="0.01" type="number" />
                </label>

                <label className="form-field">
                  <span>Waehrung</span>
                  <input defaultValue="EUR" maxLength={3} minLength={3} name="currency" required />
                </label>

                <label className="form-field">
                  <span>Steuersatz in Prozent</span>
                  <input max="100" min="0" name="taxRate" step="0.01" type="number" />
                </label>

                <label className="form-field">
                  <span>Kostendatum</span>
                  <input defaultValue={toDateInputValue()} name="costDate" type="date" required />
                </label>

                <label className="form-field">
                  <span>Lieferant / Dienstleister</span>
                  <input name="vendorName" />
                </label>

                <label className="form-field">
                  <span>Belegreferenz</span>
                  <input name="receiptReference" />
                </label>

                <label className="form-field full-span">
                  <span>Notizen</span>
                  <textarea name="notes" rows={3} />
                </label>
              </div>

              <p className="muted-note">
                Bei Material, Arbeitszeit und Fahrt berechnet das Backend den Gesamtbetrag aus
                Menge mal Einzelkosten. Fuer Fremdleistungen und sonstige Kosten kann stattdessen
                ein manueller Gesamtbetrag angegeben werden.
              </p>

              {!itemsResult.ok ? (
                <p className="muted-note">
                  Artikel konnten nicht geladen werden. Die Kostenzeile kann ohne Artikelbezug
                  erfasst werden.
                </p>
              ) : null}

              <div className="form-actions">
                <button className="primary-button" type="submit">
                  Kostenzeile speichern
                </button>
              </div>
            </form>
          ) : (
            <p>Kostenzeilen sind fuer Worker lesbar. Aenderungen duerfen nur Office und Owner vornehmen.</p>
          )}
        </article>
      </section>

      <section className="panel">
        <p className="eyebrow">Kostenbuch</p>
        <h2>Erfasste Kostenzeilen</h2>
        {jobCosts && jobCosts.costLines.length > 0 ? (
          <div className="stack-list">
            {jobCosts.costLines.map((costLine) => (
              <div className="stack-item" key={costLine.id}>
                <div className="row-spread">
                  <div>
                    <strong>{costLine.description}</strong>
                    <p className="compact-text">
                      {getJobCostKindLabel(costLine.kind)} · {formatJobCostDate(costLine.costDate)}
                    </p>
                  </div>
                  <strong>{formatJobCostMoney(costLine.totalCost, costLine.currency)}</strong>
                </div>
                <div className="meta-inline">
                  <span>
                    {costLine.quantity} {getJobCostUnitLabel(costLine.unit)}
                  </span>
                  <span>
                    Einzelkosten:{' '}
                    {costLine.unitCost === undefined
                      ? 'manueller Gesamtbetrag'
                      : formatJobCostMoney(costLine.unitCost, costLine.currency)}
                  </span>
                  <span>{costLine.item ? `${costLine.item.customId} · ${costLine.item.name}` : 'Ohne Artikelbezug'}</span>
                  {costLine.vendorName ? <span>{costLine.vendorName}</span> : null}
                  {costLine.receiptReference ? <span>Beleg: {costLine.receiptReference}</span> : null}
                </div>
                {costLine.notes ? <p>{costLine.notes}</p> : null}

                {canWriteCosts ? (
                  <details className="nested-stack">
                    <summary>Kostenzeile bearbeiten</summary>
                    <form
                      action={updateJobCostAction.bind(null, job.id, costLine.id)}
                      className="form-stack"
                    >
                      <div className="form-grid">
                        <label className="form-field">
                          <span>Kostenart</span>
                          <select defaultValue={costLine.kind} name="kind">
                            {jobCostKinds.map((kind) => (
                              <option key={kind} value={kind}>
                                {getJobCostKindLabel(kind)}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="form-field">
                          <span>Artikelbezug</span>
                          <select defaultValue={costLine.item?.id ?? ''} name="itemId">
                            <option value="">Ohne Artikelbezug</option>
                            {itemOptions.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.customId} · {item.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="form-field full-span">
                          <span>Beschreibung</span>
                          <input defaultValue={costLine.description} name="description" required />
                        </label>
                        <label className="form-field">
                          <span>Menge</span>
                          <input defaultValue={costLine.quantity} min="0.001" name="quantity" step="0.001" type="number" required />
                        </label>
                        <label className="form-field">
                          <span>Einheit</span>
                          <select defaultValue={costLine.unit} name="unit">
                            {jobCostUnits.map((unit) => (
                              <option key={unit} value={unit}>
                                {getJobCostUnitLabel(unit)}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="form-field">
                          <span>Einzelkosten</span>
                          <input defaultValue={costLine.unitCost} min="0" name="unitCost" step="0.01" type="number" />
                        </label>
                        <label className="form-field">
                          <span>Manueller Gesamtbetrag</span>
                          <input
                            defaultValue={costLine.unitCost === undefined ? costLine.totalCost : undefined}
                            min="0"
                            name="totalCost"
                            step="0.01"
                            type="number"
                          />
                        </label>
                        <label className="form-field">
                          <span>Waehrung</span>
                          <input defaultValue={costLine.currency} maxLength={3} minLength={3} name="currency" required />
                        </label>
                        <label className="form-field">
                          <span>Steuersatz in Prozent</span>
                          <input defaultValue={costLine.taxRate} max="100" min="0" name="taxRate" step="0.01" type="number" />
                        </label>
                        <label className="form-field">
                          <span>Kostendatum</span>
                          <input defaultValue={toDateInputValue(costLine.costDate)} name="costDate" type="date" required />
                        </label>
                        <label className="form-field">
                          <span>Lieferant / Dienstleister</span>
                          <input defaultValue={costLine.vendorName ?? ''} name="vendorName" />
                        </label>
                        <label className="form-field">
                          <span>Belegreferenz</span>
                          <input defaultValue={costLine.receiptReference ?? ''} name="receiptReference" />
                        </label>
                        <label className="form-field full-span">
                          <span>Notizen</span>
                          <textarea defaultValue={costLine.notes ?? ''} name="notes" rows={3} />
                        </label>
                      </div>
                      <p className="muted-note">
                        Bei vorhandenen Einzelkosten berechnet das Backend den Gesamtbetrag neu.
                        Fuer einen manuellen Gesamtbetrag das Feld Einzelkosten leer lassen.
                      </p>
                      <div className="form-actions">
                        <button className="secondary-button" type="submit">
                          Kostenzeile aktualisieren
                        </button>
                      </div>
                    </form>
                  </details>
                ) : null}
              </div>
            ))}
          </div>
        ) : jobCosts ? (
          <p>Zu diesem Auftrag wurden noch keine Kostenzeilen erfasst.</p>
        ) : (
          <p>Das Kostenbuch ist derzeit nicht verfuegbar.</p>
        )}
      </section>

      <section className="content-grid">
        <article className="panel">
          <p className="eyebrow">Team</p>
          <h2>Beteiligte Personen</h2>
          {job.assignedTeamMembers.length > 0 ? (
            <div className="stack-list">
              {job.assignedTeamMembers.map((member) => (
                <div className="stack-item" key={member.id}>
                  <strong>{member.name}</strong>
                  <p>{member.roleLabel ?? 'Mitarbeiter'}</p>
                  <span>{member.email}</span>
                </div>
              ))}
            </div>
          ) : (
            <p>Fuer das aktuell zugewiesene Team sind noch keine Mitglieder hinterlegt.</p>
          )}
        </article>

        <article className="panel">
          <p className="eyebrow">Status</p>
          <h2>Naechsten erlaubten Schritt ausfuehren</h2>
          {allowedStatusTargets.length > 0 ? (
            <form action={transitionJobStatusAction.bind(null, job.id)} className="form-stack">
              <label className="form-field">
                <span>Neuer Status</span>
                <select defaultValue={allowedStatusTargets[0]} name="status">
                  {allowedStatusTargets.map((status) => (
                    <option key={status} value={status}>
                      {getJobStatusLabel(status)}
                    </option>
                  ))}
                </select>
              </label>

              <div className="form-actions">
                <button className="secondary-button" type="submit">
                  Status wechseln
                </button>
              </div>
            </form>
          ) : (
            <p>
              Fuer den aktuellen Status gibt es im MVP keinen direkten Folgeschritt.
              Falls der Auftrag wieder aktiviert werden soll, muss er zuerst sauber
              ueber den vorgesehenen Pfad geoeffnet werden.
            </p>
          )}

          <div className="stack-list nested-stack">
            <div className="stack-item">
              <strong>Aktuell</strong>
              <p>{getJobStatusLabel(job.status)}</p>
            </div>
            <div className="stack-item">
              <strong>Erlaubte Ziele</strong>
              <p>
                {allowedStatusTargets.length > 0
                  ? allowedStatusTargets.map((status) => getJobStatusLabel(status)).join(', ')
                  : 'Keine direkte Folgeaktion hinterlegt'}
              </p>
            </div>
          </div>
        </article>
      </section>

      <section className="content-grid">
        <article className="panel">
          <p className="eyebrow">Bericht erfassen</p>
          <h2>Rueckmeldung direkt zum Auftrag</h2>
          <form action={createJobReportAction.bind(null, job.id)} className="form-stack">
            <div className="form-grid">
              <label className="form-field">
                <span>Berichtstyp</span>
                <select defaultValue="GENERAL" name="type">
                  <option value="GENERAL">Allgemeiner Bericht</option>
                  <option value="WORKER_FINDING">Worker-Fund</option>
                  <option value="WORK_COMPLETION">Arbeitsabschluss</option>
                  <option value="INCIDENT_REPORT">Stoerungsbericht</option>
                  <option value="FOLLOW_UP_REQUEST">Folgeauftrag anfragen</option>
                </select>
              </label>

              <label className="form-field">
                <span>Teamkontext</span>
                <select defaultValue={job.assignedTeam?.id ?? ''} name="teamId">
                  <option value="">Ohne Teamkontext speichern</option>
                  {teamsResult.ok && teamsResult.data
                    ? teamsResult.data.teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))
                    : null}
                </select>
              </label>

              <label className="form-field full-span">
                <span>Zusammenfassung</span>
                <input
                  name="summary"
                  placeholder="Zum Beispiel Vor-Ort-Abnahme vorbereitet"
                  required
                />
              </label>

              <label className="form-field full-span">
                <span>Feststellung</span>
                <textarea
                  name="findingSummary"
                  placeholder="Was wurde vor Ort festgestellt?"
                  rows={3}
                />
              </label>

              <label className="form-field">
                <span>Ausgefuehrte Arbeiten</span>
                <textarea
                  name="workPerformed"
                  placeholder="Was wurde erledigt?"
                  rows={4}
                />
              </label>

              <label className="form-field">
                <span>Noch erforderlich</span>
                <textarea
                  name="workStillNeeded"
                  placeholder="Was ist noch offen?"
                  rows={4}
                />
              </label>

              <label className="form-field full-span">
                <span>Details</span>
                <textarea
                  name="details"
                  placeholder="Was wurde geklaert, was fehlt noch, welcher Nachweis folgt als Nächstes?"
                  rows={5}
                />
              </label>

              <label className="form-field full-span checkbox-field">
                <input name="followUpRequired" type="checkbox" />
                <span>Folgeaktion erforderlich</span>
              </label>

              <label className="form-field full-span">
                <span>Hinweise zur Folgeaktion</span>
                <textarea
                  name="followUpNotes"
                  placeholder="Welche Pruefung, Reparatur oder Abstimmung soll folgen?"
                  rows={3}
                />
              </label>
            </div>

            <p className="muted-note">
              Allgemeine Berichte bleiben mit Zusammenfassung und optionalen Details moeglich.
              Worker-Funde und Stoerungsberichte benoetigen mindestens ein inhaltliches Feld.
            </p>

            <div className="form-actions">
              <button className="secondary-button" type="submit">
                Bericht anlegen
              </button>
            </div>
          </form>
        </article>

        <article className="panel">
          <p className="eyebrow">Nachweis hochladen</p>
          <h2>Foto oder Datei am Auftrag hinterlegen</h2>
          <form action={uploadJobAttachmentAction.bind(null, job.id)} className="form-stack">
            <div className="form-grid">
              <label className="form-field full-span">
                <span>Datei</span>
                <input name="file" type="file" required />
              </label>

              <label className="form-field">
                <span>Typ</span>
                <select defaultValue="" name="kind">
                  <option value="">Automatisch aus Dateityp ableiten</option>
                  <option value="PHOTO">Foto</option>
                  <option value="FILE">Datei</option>
                </select>
              </label>

              <label className="form-field">
                <span>Teamkontext</span>
                <select defaultValue={job.assignedTeam?.id ?? ''} name="teamId">
                  <option value="">Ohne Teamkontext speichern</option>
                  {teamsResult.ok && teamsResult.data
                    ? teamsResult.data.teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))
                    : null}
                </select>
              </label>

              <label className="form-field">
                <span>Berichtslink</span>
                <select defaultValue="" name="reportId">
                  <option value="">Direkt am Auftrag speichern</option>
                  {reports.map((report) => (
                    <option key={report.id} value={report.id}>
                      {report.summary}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-field">
                <span>Bildunterschrift / Hinweis</span>
                <input
                  name="caption"
                  placeholder="Kurzbeschreibung fuer die Review-Ansicht"
                />
              </label>
            </div>

            {reports.length === 0 ? (
              <p className="muted-note">
                Es gibt noch keinen verknuepfbaren Bericht. Die Datei kann trotzdem direkt am
                Auftrag gespeichert werden.
              </p>
            ) : null}

            <div className="form-actions">
              <button className="secondary-button" type="submit">
                Nachweis hochladen
              </button>
            </div>
          </form>
        </article>
      </section>

      <section className="content-grid">
        <article className="panel">
          <p className="eyebrow">Berichte</p>
          <h2>Rueckmeldungen zum Auftrag</h2>
          {reports.length > 0 ? (
            <div className="stack-list">
              {reports.map((report) => {
                const linkedAttachments = attachments.filter(
                  (attachment) => attachment.report?.id === report.id,
                );

                return (
                  <div className="stack-item" key={report.id}>
                    <div className="row-spread">
                      <div>
                        <strong>{report.summary}</strong>
                        <p className="compact-text">
                          {getJobReportTypeLabel(report.type)} ·{' '}
                          {report.author?.name ?? 'Unbekannter Absender'} ·{' '}
                          {report.team?.name ?? 'Ohne Teamkontext'}
                        </p>
                      </div>
                      <span className="inline-chip">
                        {getReportReviewStatusLabel(report.reviewStatus)}
                      </span>
                    </div>
                    {report.findingSummary ? (
                      <div>
                        <strong>Feststellung</strong>
                        <p>{report.findingSummary}</p>
                      </div>
                    ) : null}
                    {report.workPerformed ? (
                      <div>
                        <strong>Ausgefuehrte Arbeiten</strong>
                        <p>{report.workPerformed}</p>
                      </div>
                    ) : null}
                    {report.workStillNeeded ? (
                      <div>
                        <strong>Noch erforderlich</strong>
                        <p>{report.workStillNeeded}</p>
                      </div>
                    ) : null}
                    {report.details ? (
                      <div>
                        <strong>Weitere Details</strong>
                        <p>{report.details}</p>
                      </div>
                    ) : null}
                    <div>
                      <strong>Folgeaktion</strong>
                      <p>
                        {report.followUpRequired
                          ? report.followUpNotes ?? 'Erforderlich, noch ohne Zusatzhinweis.'
                          : 'Nicht erforderlich.'}
                      </p>
                    </div>
                    {report.reviewedBy || report.reviewNotes ? (
                      <div>
                        <strong>Pruefung</strong>
                        <p>{report.reviewNotes ?? 'Ohne Pruefnotiz.'}</p>
                        <p className="compact-text">
                          {report.reviewedBy?.name ?? 'Office'}
                          {report.reviewedAt ? ` · ${formatDateTime(report.reviewedAt)}` : ''}
                        </p>
                      </div>
                    ) : null}
                    <div className="meta-inline">
                      <span>{formatDateTime(report.createdAt)}</span>
                      <span>{linkedAttachments.length} verknuepfte Datei(en)</span>
                    </div>
                    {canReviewReports && isReportAwaitingReview(report) ? (
                      <form
                        action={reviewJobReportAction.bind(null, job.id, report.id)}
                        className="form-stack nested-stack"
                      >
                        <div className="form-grid">
                          <label className="form-field">
                            <span>Pruefentscheidung</span>
                            <select defaultValue="APPROVED" name="reviewStatus">
                              <option value="APPROVED">Freigeben</option>
                              <option value="NEEDS_REVISION">Ueberarbeitung anfordern</option>
                              <option value="REJECTED">Ablehnen</option>
                            </select>
                          </label>
                          <label className="form-field">
                            <span>Pruefnotiz</span>
                            <textarea name="reviewNotes" rows={3} />
                          </label>
                        </div>
                        <div className="form-actions">
                          <button className="secondary-button" type="submit">
                            Pruefung speichern
                          </button>
                        </div>
                      </form>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <p>Zu diesem Auftrag liegt aktuell noch kein eingereichter Bericht vor.</p>
          )}
        </article>

        <article className="panel">
          <p className="eyebrow">Nachweise</p>
          <h2>Fotos und Dateien zum Auftrag</h2>

          {photoAttachments.length > 0 ? (
            <div className="proof-grid compact-grid">
              {photoAttachments.map((attachment) => (
                <article className="proof-card" key={attachment.id}>
                  <a href={getAttachmentProxyUrl(attachment.id)} target="_blank" rel="noreferrer">
                    <img
                      className="proof-image"
                      src={getAttachmentProxyUrl(attachment.id)}
                      alt={attachment.caption ?? attachment.fileName}
                    />
                  </a>
                  <strong>{attachment.caption ?? attachment.fileName}</strong>
                  <div className="meta-inline">
                    <span>{attachment.team?.name ?? 'Ohne Teamkontext'}</span>
                    <span>{formatDateTime(attachment.uploadedAt)}</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p>Es wurden noch keine Foto-Nachweise fuer diesen Auftrag hochgeladen.</p>
          )}

          {fileAttachments.length > 0 ? (
            <div className="stack-list nested-stack">
              {fileAttachments.map((attachment) => (
                <div className="stack-item" key={attachment.id}>
                  <div className="row-spread">
                    <div>
                      <strong>{attachment.fileName}</strong>
                      <p className="compact-text">
                        {attachment.report?.summary ?? 'Direkt am Auftrag hinterlegt'}
                      </p>
                    </div>
                    <span className="inline-chip">{getAttachmentKindLabel(attachment.kind)}</span>
                  </div>
                  <div className="meta-inline">
                    <span>{attachment.mimeType}</span>
                    <span>{formatFileSize(attachment.sizeBytes)}</span>
                    <span>{attachment.uploadedBy?.name ?? 'Unbekannter Upload'}</span>
                  </div>
                  <div className="action-row">
                    <a href={getAttachmentProxyUrl(attachment.id)} target="_blank" rel="noreferrer">
                      Datei oeffnen
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </article>
      </section>

      <section className="panel">
        <p className="eyebrow">Aktivitaet</p>
        <h2>Log und Dokumentation</h2>
        <div className="stack-list">
          {job.activity.map((entry) => (
            <div className="stack-item" key={entry.id}>
              <div className="row-spread">
                <strong>{entry.title}</strong>
                <span>{formatDateTime(entry.createdAt)}</span>
              </div>
              <p>{entry.content ?? 'Kein Zusatztext vorhanden.'}</p>
              <span>{entry.authorName ?? entry.kind}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
