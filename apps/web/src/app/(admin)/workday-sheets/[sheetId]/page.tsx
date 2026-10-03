import Link from 'next/link';

import {
  addWorkdaySheetRowAction,
  deleteWorkdaySheetRowAction,
  transitionWorkdaySheetAction,
  updateActualWorkdaySheetRowAction,
  updatePlannedWorkdaySheetRowAction,
  updateWorkdaySheetAction,
} from '../../../../lib/workday-sheet-actions';
import { formatDateTime } from '../../../../lib/operations';
import { requireServerSession } from '../../../../lib/server-auth';
import {
  getWorkdaySheetData,
  getWorkdaySheetOptionsData,
  getWorkdaySheetStatusLabel,
  getWorkdaySheetStatusTone,
} from '../../../../lib/workday-sheets';
import { WorkdaySheetPrintButton } from '../workday-sheet-print-button';
import { WorkdaySheetFollowUpJobForm } from '../workday-sheet-follow-up-job-form';
import { WorkdaySheetRelationFields } from '../workday-sheet-relation-fields';
import { WorkdaySheetRowSummary } from '../workday-sheet-row-summary';

const notices: Record<string, string> = {
  'sheet-created': 'Der Tageszettel wurde als Entwurf angelegt.',
  'sheet-updated': 'Die Kopfdaten wurden gespeichert.',
  'row-added': 'Die Planzeile wurde angelegt.',
  'row-updated': 'Die Planzeile wurde gespeichert.',
  'row-deleted': 'Die Planzeile wurde entfernt.',
  'actual-updated': 'Die Ausführung wurde gespeichert.',
  'status-sent': 'Der Tageszettel wurde gesendet und die Planung gesperrt.',
  'status-submitted': 'Der Tageszettel wurde eingereicht.',
  'status-reviewed': 'Der Tageszettel wurde geprüft.',
  'status-archived': 'Der Tageszettel wurde archiviert.',
  'follow-up-job-created': 'Der Folgeauftrag wurde erstellt und mit der Quellzeile protokolliert.',
  'follow-up-job-existing': 'Der bereits erstellte Folgeauftrag wurde wiederverwendet.',
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('de-DE', { dateStyle: 'full', timeZone: 'UTC' }).format(
    new Date(`${value}T00:00:00.000Z`),
  );
}
export default async function WorkdaySheetDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ sheetId: string }>;
  searchParams?: Promise<{ notice?: string; error?: string }>;
}) {
  const [{ sheetId }, session, query] = await Promise.all([
    params,
    requireServerSession(),
    searchParams,
  ]);
  const canManage = session.membershipRole === 'OWNER' || session.membershipRole === 'OFFICE';
  const [detailResult, optionsResult] = await Promise.all([
    getWorkdaySheetData(sheetId),
    canManage ? getWorkdaySheetOptionsData() : Promise.resolve(null),
  ]);
  const sheet = detailResult.data?.workdaySheet;
  const options = optionsResult?.data;

  if (!detailResult.ok || !sheet) {
    return (
      <main className="content-page">
        <section className="panel flash-banner error">
          <strong>Tageszettel nicht verfügbar.</strong>
          <p>{detailResult.error}</p>
          <Link className="secondary-link" href="/workday-sheets">
            Zur Übersicht
          </Link>
        </section>
      </main>
    );
  }

  const flash = query?.error
    ? { tone: 'error', text: query.error }
    : query?.notice && notices[query.notice]
      ? { tone: 'success', text: notices[query.notice] }
      : null;
  const isComplete = sheet.rowCount > 0 && sheet.completedRowCount === sheet.rowCount;
  const isLocked = sheet.status === 'REVIEWED' || sheet.status === 'ARCHIVED';

  return (
    <main className="content-page workday-sheet-detail-page">
      <section className="hero-card worksheet-print-header">
        <div className="row-spread">
          <div>
            <p className="eyebrow">Tageszettel · {formatDate(sheet.date)}</p>
            <h1>{sheet.title ?? 'Arbeitstag ohne Titel'}</h1>
          </div>
          <span className={`status-pill ${getWorkdaySheetStatusTone(sheet.status)}`}>
            {getWorkdaySheetStatusLabel(sheet.status)}
          </span>
        </div>
        <div className="detail-meta">
          <span className="inline-chip">Team: {sheet.team?.name ?? '—'}</span>
          <span className="inline-chip">Mitarbeiter: {sheet.worker?.name ?? '—'}</span>
          <span className="inline-chip">
            Erledigt: {sheet.completedRowCount}/{sheet.rowCount}
          </span>
        </div>
        <p className="worksheet-screen-only">
          Geplante Arbeit und tatsächliche Ausführung bleiben in einem Tagesprotokoll
          nachvollziehbar. Der Tageszettel ist kein zweiter Auftrag.
        </p>
        <div className="form-actions worksheet-screen-only">
          <Link className="secondary-link" href="/workday-sheets">
            Zur Übersicht
          </Link>
          <WorkdaySheetPrintButton />
        </div>
      </section>

      {flash ? (
        <section
          className={`panel flash-banner worksheet-screen-only ${
            flash.tone === 'error' ? 'error' : ''
          }`}
        >
          <strong>{flash.tone === 'error' ? 'Aktion fehlgeschlagen' : 'Aktion gespeichert'}</strong>
          <p>{flash.text}</p>
        </section>
      ) : null}

      {sheet.status !== 'DRAFT' ? (
        <section className={`panel worksheet-lock-state ${isLocked ? 'locked' : ''}`}>
          <strong>
            {sheet.status === 'SENT'
              ? 'Planung gesperrt · Ausführung freigegeben'
              : sheet.status === 'SUBMITTED'
                ? 'Eingereicht · wartet auf Office-Prüfung'
                : sheet.status === 'REVIEWED'
                  ? 'Geprüft · Inhalt gesperrt, Folgeaktionen verfügbar'
                  : 'Archiviert · terminal und vollständig gesperrt'}
          </strong>
          <p>
            {sheet.status === 'SENT'
              ? 'Planzeilen und Zuweisung können nicht mehr verändert werden.'
              : sheet.status === 'SUBMITTED'
                ? 'Die Ausführung kann nach dem Einreichen nicht mehr geändert werden.'
                : sheet.status === 'REVIEWED'
                  ? 'Planung und Ausführung bleiben unverändert; das Office kann einzelne Zeilen bewusst in normale Folgeaufträge überführen.'
                  : 'Dieser Tageszettel dient nur noch als nachvollziehbarer Nachweis.'}
          </p>
        </section>
      ) : null}

      {canManage && sheet.status === 'DRAFT' && options ? (
        <section className="panel worksheet-screen-only">
          <p className="eyebrow">Planung</p>
          <h2>Kopfdaten und Zuweisung</h2>
          <form action={updateWorkdaySheetAction.bind(null, sheet.id)} className="form-stack">
            <div className="form-grid">
              <label className="form-field">
                <span>Arbeitstag</span>
                <input defaultValue={sheet.date} name="date" required type="date" />
              </label>
              <label className="form-field">
                <span>Titel</span>
                <input defaultValue={sheet.title ?? ''} name="title" />
              </label>
              <label className="form-field">
                <span>Team</span>
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
                <span>Mitarbeiter</span>
                <select defaultValue={sheet.workerUserId ?? ''} name="workerUserId">
                  <option value="">Kein direkter Mitarbeiter</option>
                  {options.workers.map((worker) => (
                    <option key={worker.id} value={worker.id}>
                      {worker.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-field full-span">
                <span>Interne Notizen</span>
                <textarea defaultValue={sheet.internalNotes ?? ''} name="internalNotes" rows={3} />
              </label>
            </div>
            <div className="form-actions">
              <button className="secondary-button" type="submit">
                Kopfdaten speichern
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {canManage && sheet.internalNotes && sheet.status !== 'DRAFT' ? (
        <section className="panel worksheet-internal-notes worksheet-screen-only">
          <p className="eyebrow">Nur Office</p>
          <h2>Interne Notizen</h2>
          <p>{sheet.internalNotes}</p>
        </section>
      ) : null}

      <section className="panel worksheet-rows-section">
        <div className="row-spread">
          <div>
            <p className="eyebrow">Arbeitsprotokoll</p>
            <h2>Geplant und erledigt</h2>
          </div>
          <span className="inline-chip">{sheet.rows.length} Zeilen</span>
        </div>
        <div className="worksheet-row-list">
          {sheet.rows.map((row, index) => {
            const workerCanEdit = session.membershipRole === 'WORKER' && sheet.status === 'SENT';
            return (
              <article className="worksheet-row-card" key={row.id}>
                {canManage && sheet.status === 'DRAFT' && options ? (
                  <>
                    <div className="worksheet-print-only">
                      <WorkdaySheetRowSummary row={row} rowNumber={index + 1} />
                    </div>
                    <div className="worksheet-screen-only">
                      <div className="row-spread">
                        <div>
                          <p className="eyebrow">Planzeile {index + 1}</p>
                          <h3>Planung bearbeiten</h3>
                        </div>
                        <span className="status-pill">Entwurf</span>
                      </div>
                      <form
                        action={updatePlannedWorkdaySheetRowAction.bind(null, sheet.id, row.id)}
                        className="form-stack"
                      >
                        <div className="form-grid">
                          <label className="form-field">
                            <span>Beginn</span>
                            <input
                              defaultValue={row.startTime ?? ''}
                              name="startTime"
                              type="time"
                            />
                          </label>
                          <label className="form-field">
                            <span>Ende</span>
                            <input defaultValue={row.endTime ?? ''} name="endTime" type="time" />
                          </label>
                          <label className="form-field full-span">
                            <span>Geplante Arbeit</span>
                            <textarea
                              defaultValue={row.plannedText}
                              name="plannedText"
                              required
                              rows={3}
                            />
                          </label>
                          <label className="form-field full-span">
                            <span>Planhinweis</span>
                            <textarea defaultValue={row.notes ?? ''} name="notes" rows={2} />
                          </label>
                          <WorkdaySheetRelationFields options={options} row={row} />
                        </div>
                        <div className="form-actions">
                          <button className="secondary-button" type="submit">
                            Zeile speichern
                          </button>
                        </div>
                      </form>
                      <form action={deleteWorkdaySheetRowAction.bind(null, sheet.id, row.id)}>
                        <button className="danger-button" type="submit">
                          Zeile entfernen
                        </button>
                      </form>
                    </div>
                  </>
                ) : (
                  <>
                    <WorkdaySheetRowSummary
                      row={row}
                      rowNumber={index + 1}
                      showActual={!workerCanEdit}
                    />
                    {workerCanEdit ? (
                      <form
                        action={updateActualWorkdaySheetRowAction.bind(null, sheet.id, row.id)}
                        className="form-stack worksheet-screen-only"
                      >
                        <label className="form-field">
                          <span>Erledigt / tatsächlich ausgeführt</span>
                          <textarea
                            defaultValue={row.actualText ?? ''}
                            name="actualText"
                            placeholder="Ausgeführte Arbeit, Abweichungen, Zusatzarbeit oder Feststellungen"
                            required
                            rows={4}
                          />
                        </label>
                        <div className="form-actions">
                          <button className="primary-button" type="submit">
                            Ausführung speichern
                          </button>
                        </div>
                      </form>
                    ) : null}
                    {workerCanEdit ? (
                      <div className="worksheet-print-only">
                        <div className="worksheet-actual-text">
                          <strong>Erledigt / tatsächlich ausgeführt</strong>
                          <p>{row.actualText ?? 'Noch keine Ausführung erfasst.'}</p>
                        </div>
                      </div>
                    ) : null}
                  </>
                )}
                {canManage && row.reviewActions.length ? (
                  <div className="worksheet-follow-up-result worksheet-screen-only">
                    <strong>Erstellter Folgeauftrag</strong>
                    {row.reviewActions.map((action) => (
                      <div className="row-spread" key={action.id}>
                        <span>
                          {action.destinationJob.reference} · {action.destinationJob.title}
                        </span>
                        <Link
                          className="secondary-link"
                          href={`/jobs/${action.destinationJob.id}`}
                        >
                          Auftrag öffnen
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : null}
                {canManage && sheet.status === 'REVIEWED' && options && !row.reviewActions.length ? (
                  <WorkdaySheetFollowUpJobForm options={options} row={row} sheet={sheet} />
                ) : null}
              </article>
            );
          })}
        </div>
      </section>

      {canManage && sheet.status === 'DRAFT' && options ? (
        <section className="panel worksheet-screen-only">
          <p className="eyebrow">Schnell hinzufügen</p>
          <h2>Weitere Planzeile</h2>
          <form action={addWorkdaySheetRowAction.bind(null, sheet.id)} className="form-stack">
            <div className="form-grid">
              <label className="form-field">
                <span>Beginn</span>
                <input name="startTime" type="time" />
              </label>
              <label className="form-field">
                <span>Ende</span>
                <input name="endTime" type="time" />
              </label>
              <label className="form-field full-span">
                <span>Geplante Arbeit</span>
                <textarea
                  name="plannedText"
                  placeholder="11:00 Musterstr. 1 — Tischler reinlassen / Schlüsselübergabe"
                  required
                  rows={3}
                />
              </label>
              <label className="form-field full-span">
                <span>Planhinweis</span>
                <textarea name="notes" rows={2} />
              </label>
              <WorkdaySheetRelationFields options={options} />
            </div>
            <div className="form-actions">
              <button className="secondary-button" type="submit">
                Zeile hinzufügen
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="panel worksheet-review-section">
        <p className="eyebrow">Prüfung und Status</p>
        <h2>{getWorkdaySheetStatusLabel(sheet.status)}</h2>

        <div className="worksheet-screen-only">
          {canManage && sheet.status === 'DRAFT' ? (
            <form action={transitionWorkdaySheetAction.bind(null, sheet.id, 'SENT')}>
              <button className="primary-button" type="submit">
                Senden und Planung sperren
              </button>
            </form>
          ) : null}
          {session.membershipRole === 'WORKER' && sheet.status === 'SENT' ? (
            <>
              <form action={transitionWorkdaySheetAction.bind(null, sheet.id, 'SUBMITTED')}>
                <button className="primary-button" disabled={!isComplete} type="submit">
                  Tageszettel einreichen
                </button>
              </form>
              {!isComplete ? (
                <p className="muted-note">
                  Vor dem Einreichen muss jede Planzeile eine Ausführung enthalten.
                </p>
              ) : null}
            </>
          ) : null}
          {canManage && sheet.status === 'SUBMITTED' ? (
            <form
              action={transitionWorkdaySheetAction.bind(null, sheet.id, 'REVIEWED')}
              className="form-stack"
            >
              <label className="form-field">
                <span>Prüfnotiz (optional)</span>
                <textarea name="reviewNotes" rows={3} />
              </label>
              <div className="form-actions">
                <button className="primary-button" type="submit">
                  Prüfen und abschließen
                </button>
              </div>
            </form>
          ) : null}
          {canManage && sheet.status === 'REVIEWED' ? (
            <form action={transitionWorkdaySheetAction.bind(null, sheet.id, 'ARCHIVED')}>
              <button className="secondary-button" type="submit">
                Archivieren
              </button>
            </form>
          ) : null}
        </div>

        {sheet.status === 'SENT' && canManage ? (
          <p>Der Tageszettel liegt beim zugewiesenen Mitarbeiter oder Team.</p>
        ) : null}
        {sheet.status === 'SUBMITTED' && !canManage ? (
          <p>Das Office prüft den eingereichten Tageszettel.</p>
        ) : null}
        {sheet.reviewNotes ? (
          <div className="worksheet-review-note">
            <strong>Prüfnotiz</strong>
            <p>{sheet.reviewNotes}</p>
          </div>
        ) : sheet.status === 'REVIEWED' || sheet.status === 'ARCHIVED' ? (
          <p className="muted-note">Ohne zusätzliche Prüfnotiz abgeschlossen.</p>
        ) : null}
      </section>

      <section className="panel worksheet-audit-section">
        <p className="eyebrow">Nachweis</p>
        <h2>Bearbeitungsverlauf</h2>
        <dl className="info-list">
          <div>
            <dt>Erstellt</dt>
            <dd>
              {sheet.createdBy.name} · {formatDateTime(sheet.createdAt)}
            </dd>
          </div>
          {sheet.sentAt ? (
            <div>
              <dt>Gesendet</dt>
              <dd>
                {sheet.sentBy?.name} · {formatDateTime(sheet.sentAt)}
              </dd>
            </div>
          ) : null}
          {sheet.submittedAt ? (
            <div>
              <dt>Eingereicht</dt>
              <dd>
                {sheet.submittedBy?.name} · {formatDateTime(sheet.submittedAt)}
              </dd>
            </div>
          ) : null}
          {sheet.reviewedAt ? (
            <div>
              <dt>Geprüft</dt>
              <dd>
                {sheet.reviewedBy?.name} · {formatDateTime(sheet.reviewedAt)}
              </dd>
            </div>
          ) : null}
          {sheet.archivedAt ? (
            <div>
              <dt>Archiviert</dt>
              <dd>
                {sheet.archivedBy?.name} · {formatDateTime(sheet.archivedAt)}
              </dd>
            </div>
          ) : null}
        </dl>
      </section>
    </main>
  );
}
