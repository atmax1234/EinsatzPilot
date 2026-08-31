import Link from 'next/link';

import type { WorkdaySheetRowItem } from '@einsatzpilot/types';

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
} from '../../../../lib/workday-sheets';
import { WorkdaySheetRelationFields } from '../workday-sheet-relation-fields';

const notices: Record<string, string> = {
  'sheet-created': 'Das Tagesblatt wurde als Entwurf angelegt.',
  'sheet-updated': 'Die Kopfdaten wurden gespeichert.',
  'row-added': 'Die Planzeile wurde angelegt.',
  'row-updated': 'Die Planzeile wurde gespeichert.',
  'row-deleted': 'Die Planzeile wurde entfernt.',
  'actual-updated': 'Die Ist-Arbeit wurde gespeichert.',
  'status-sent': 'Das Tagesblatt wurde gesendet und gesperrt.',
  'status-submitted': 'Das Tagesblatt wurde abgegeben.',
  'status-reviewed': 'Das Tagesblatt wurde geprueft.',
  'status-archived': 'Das Tagesblatt wurde archiviert.',
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('de-DE', { dateStyle: 'full', timeZone: 'UTC' }).format(
    new Date(`${value}T00:00:00.000Z`),
  );
}

function RowContext({ row }: { row: WorkdaySheetRowItem }) {
  const values = [
    row.customer?.name,
    row.address ? `${row.address.label} · ${row.address.street}, ${row.address.city}` : undefined,
    row.object?.name,
    row.objectArea?.name,
    row.job ? `${row.job.reference} · ${row.job.title}` : undefined,
  ].filter(Boolean);
  return values.length ? <p className="muted-note">Kontext: {values.join(' · ')}</p> : null;
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
        <section className="panel flash-banner error"><strong>Tagesblatt nicht verfuegbar.</strong><p>{detailResult.error}</p><Link className="secondary-link" href="/workday-sheets">Zur Uebersicht</Link></section>
      </main>
    );
  }

  const flash = query?.error
    ? { tone: 'error', text: query.error }
    : query?.notice && notices[query.notice]
      ? { tone: 'success', text: notices[query.notice] }
      : null;

  return (
    <main className="content-page">
      <section className="hero-card">
        <div className="row-spread">
          <div><p className="eyebrow">Tagesblatt · {formatDate(sheet.date)}</p><h1>{sheet.title ?? 'Arbeitstag ohne Titel'}</h1></div>
          <span className="status-pill">{getWorkdaySheetStatusLabel(sheet.status)}</span>
        </div>
        <div className="detail-meta">
          <span className="inline-chip">Team: {sheet.team?.name ?? '—'}</span>
          <span className="inline-chip">WORKER: {sheet.worker?.name ?? '—'}</span>
          <span className="inline-chip">Ist: {sheet.completedRowCount}/{sheet.rowCount}</span>
        </div>
        <p>Planzeilen bleiben bewusst leichter als Auftraege. Nach dem Senden sind Planung und Zuweisung gesperrt; der WORKER erfasst nur die tatsaechliche Ausfuehrung.</p>
        <Link className="secondary-link" href="/workday-sheets">Zur Uebersicht</Link>
      </section>

      {flash ? <section className={`panel flash-banner ${flash.tone === 'error' ? 'error' : ''}`}><strong>{flash.tone === 'error' ? 'Aktion fehlgeschlagen' : 'Aktion gespeichert'}</strong><p>{flash.text}</p></section> : null}

      {canManage && sheet.status === 'DRAFT' && options ? (
        <section className="panel">
          <p className="eyebrow">Planung</p><h2>Kopfdaten und Zuweisung</h2>
          <form action={updateWorkdaySheetAction.bind(null, sheet.id)} className="form-stack">
            <div className="form-grid">
              <label className="form-field"><span>Arbeitstag</span><input defaultValue={sheet.date} name="date" required type="date" /></label>
              <label className="form-field"><span>Titel</span><input defaultValue={sheet.title ?? ''} name="title" /></label>
              <label className="form-field"><span>Team</span><select defaultValue={sheet.teamId ?? ''} name="teamId"><option value="">Kein Team</option>{options.teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label>
              <label className="form-field"><span>WORKER</span><select defaultValue={sheet.workerUserId ?? ''} name="workerUserId"><option value="">Kein direkter WORKER</option>{options.workers.map((worker) => <option key={worker.id} value={worker.id}>{worker.name}</option>)}</select></label>
              <label className="form-field full-span"><span>Interne Office-Notizen</span><textarea defaultValue={sheet.internalNotes ?? ''} name="internalNotes" rows={3} /></label>
            </div>
            <div className="form-actions"><button className="secondary-button" type="submit">Kopfdaten speichern</button></div>
          </form>
        </section>
      ) : null}

      {canManage && sheet.internalNotes && sheet.status !== 'DRAFT' ? (
        <section className="panel"><p className="eyebrow">Office intern</p><h2>Interne Notizen</h2><p>{sheet.internalNotes}</p></section>
      ) : null}

      <section className="panel">
        <div className="row-spread"><div><p className="eyebrow">Arbeitsplan</p><h2>Plan- und Ist-Zeilen</h2></div><span className="inline-chip">{sheet.rows.length}</span></div>
        <div className="worksheet-row-list">
          {sheet.rows.map((row) => (
            <article className="worksheet-row-card" key={row.id}>
              <div className="row-spread"><div><p className="eyebrow">Zeile {row.position + 1}</p><h2>{row.startTime ? `${row.startTime}${row.endTime ? `–${row.endTime}` : ''}` : 'Ohne feste Uhrzeit'}</h2></div>{row.actualText ? <span className="status-pill done">Ist erfasst</span> : <span className="status-pill">Offen</span>}</div>

              {canManage && sheet.status === 'DRAFT' && options ? (
                <>
                  <form action={updatePlannedWorkdaySheetRowAction.bind(null, sheet.id, row.id)} className="form-stack">
                    <div className="form-grid">
                      <label className="form-field"><span>Beginn</span><input defaultValue={row.startTime ?? ''} name="startTime" type="time" /></label>
                      <label className="form-field"><span>Ende</span><input defaultValue={row.endTime ?? ''} name="endTime" type="time" /></label>
                      <label className="form-field full-span"><span>Geplante Arbeit</span><textarea defaultValue={row.plannedText} name="plannedText" required rows={3} /></label>
                      <label className="form-field full-span"><span>Planhinweis</span><textarea defaultValue={row.notes ?? ''} name="notes" rows={2} /></label>
                      <WorkdaySheetRelationFields options={options} row={row} />
                    </div>
                    <div className="form-actions"><button className="secondary-button" type="submit">Zeile speichern</button></div>
                  </form>
                  <form action={deleteWorkdaySheetRowAction.bind(null, sheet.id, row.id)}><button className="danger-button" type="submit">Zeile entfernen</button></form>
                </>
              ) : (
                <>
                  <div className="worksheet-plan-text"><strong>Plan</strong><p>{row.plannedText}</p>{row.notes ? <p className="muted-note">Hinweis: {row.notes}</p> : null}<RowContext row={row} /></div>
                  {session.membershipRole === 'WORKER' && sheet.status === 'SENT' ? (
                    <form action={updateActualWorkdaySheetRowAction.bind(null, sheet.id, row.id)} className="form-stack">
                      <label className="form-field"><span>Tatsaechlich ausgefuehrt</span><textarea defaultValue={row.actualText ?? ''} name="actualText" placeholder="Ausgefuehrte Arbeit, Abweichungen, Zusatzarbeit oder Feststellungen" required rows={4} /></label>
                      <div className="form-actions"><button className="primary-button" type="submit">Ist-Arbeit speichern</button></div>
                    </form>
                  ) : (
                    <div className="worksheet-actual-text"><strong>Ist</strong><p>{row.actualText ?? 'Noch keine Ist-Arbeit erfasst.'}</p></div>
                  )}
                </>
              )}
            </article>
          ))}
        </div>
      </section>

      {canManage && sheet.status === 'DRAFT' && options ? (
        <section className="panel">
          <p className="eyebrow">Weitere Planzeile</p><h2>Alltagsarbeit ergaenzen</h2>
          <form action={addWorkdaySheetRowAction.bind(null, sheet.id)} className="form-stack">
            <div className="form-grid">
              <label className="form-field"><span>Beginn</span><input name="startTime" type="time" /></label>
              <label className="form-field"><span>Ende</span><input name="endTime" type="time" /></label>
              <label className="form-field full-span"><span>Geplante Arbeit</span><textarea name="plannedText" placeholder="11:00 Musterstr. 1 — Tischler reinlassen / Schluesseluebergabe" required rows={3} /></label>
              <label className="form-field full-span"><span>Planhinweis</span><textarea name="notes" rows={2} /></label>
              <WorkdaySheetRelationFields options={options} />
            </div>
            <div className="form-actions"><button className="secondary-button" type="submit">Zeile hinzufuegen</button></div>
          </form>
        </section>
      ) : null}

      <section className="panel">
        <p className="eyebrow">Lifecycle</p><h2>Naechster erlaubter Schritt</h2>
        {canManage && sheet.status === 'DRAFT' ? <form action={transitionWorkdaySheetAction.bind(null, sheet.id, 'SENT')}><button className="primary-button" type="submit">Senden und Planung sperren</button></form> : null}
        {session.membershipRole === 'WORKER' && sheet.status === 'SENT' ? <form action={transitionWorkdaySheetAction.bind(null, sheet.id, 'SUBMITTED')}><button className="primary-button" type="submit">Tagesblatt abgeben</button></form> : null}
        {canManage && sheet.status === 'SUBMITTED' ? (
          <form action={transitionWorkdaySheetAction.bind(null, sheet.id, 'REVIEWED')} className="form-stack"><label className="form-field"><span>Pruefnotiz (optional)</span><textarea name="reviewNotes" rows={3} /></label><div className="form-actions"><button className="primary-button" type="submit">Pruefen und abschliessen</button></div></form>
        ) : null}
        {canManage && sheet.status === 'REVIEWED' ? <form action={transitionWorkdaySheetAction.bind(null, sheet.id, 'ARCHIVED')}><button className="secondary-button" type="submit">Archivieren</button></form> : null}
        {sheet.status === 'SENT' && canManage ? <p>Das Tagesblatt ist beim zugewiesenen WORKER oder Team. Die Planzeilen sind gesperrt.</p> : null}
        {sheet.status === 'SUBMITTED' && !canManage ? <p>Das Office prueft das abgegebene Tagesblatt.</p> : null}
        {sheet.status === 'ARCHIVED' ? <p>Archiviert ist terminal; weitere Aenderungen sind gesperrt.</p> : null}
        {sheet.reviewNotes ? <p>Pruefnotiz: {sheet.reviewNotes}</p> : null}
      </section>

      <section className="panel"><p className="eyebrow">Audit</p><h2>Lifecycle-Nachweis</h2><dl className="info-list"><div><dt>Erstellt</dt><dd>{sheet.createdBy.name} · {formatDateTime(sheet.createdAt)}</dd></div>{sheet.sentAt ? <div><dt>Gesendet</dt><dd>{sheet.sentBy?.name} · {formatDateTime(sheet.sentAt)}</dd></div> : null}{sheet.submittedAt ? <div><dt>Abgegeben</dt><dd>{sheet.submittedBy?.name} · {formatDateTime(sheet.submittedAt)}</dd></div> : null}{sheet.reviewedAt ? <div><dt>Geprueft</dt><dd>{sheet.reviewedBy?.name} · {formatDateTime(sheet.reviewedAt)}</dd></div> : null}{sheet.archivedAt ? <div><dt>Archiviert</dt><dd>{sheet.archivedBy?.name} · {formatDateTime(sheet.archivedAt)}</dd></div> : null}</dl></section>
    </main>
  );
}
