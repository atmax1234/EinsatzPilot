import Link from 'next/link';

import { createWorkdaySheetAction } from '../../../lib/workday-sheet-actions';
import {
  getWorkdaySheetOptionsData,
  getWorkdaySheetsData,
  getWorkdaySheetStatusLabel,
} from '../../../lib/workday-sheets';
import { requireServerSession } from '../../../lib/server-auth';
import { WorkdaySheetRelationFields } from './workday-sheet-relation-fields';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeZone: 'UTC' }).format(
    new Date(`${value}T00:00:00.000Z`),
  );
}

export default async function WorkdaySheetsPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const session = await requireServerSession();
  const canManage = session.membershipRole === 'OWNER' || session.membershipRole === 'OFFICE';
  const [sheetsResult, optionsResult, params] = await Promise.all([
    getWorkdaySheetsData(),
    canManage ? getWorkdaySheetOptionsData() : Promise.resolve(null),
    searchParams,
  ]);
  const options = optionsResult?.data;
  const sheets = sheetsResult.data?.workdaySheets ?? [];

  return (
    <main className="content-page">
      <section className="hero-card">
        <p className="eyebrow">Phase 8 · Tagesblaetter</p>
        <h1>Plan und Ist-Arbeit an einem Arbeitstag</h1>
        <p>
          Tagesblaetter sind keine zweiten Auftraege. Sie verbinden geplante Objektarbeit,
          bestehende Auftraege und spontane Hinweise mit der tatsaechlichen Ausfuehrung eines
          Teams oder WORKERs.
        </p>
      </section>

      {params?.error ? (
        <section className="panel flash-banner error"><strong>Aktion fehlgeschlagen</strong><p>{params.error}</p></section>
      ) : null}
      {!sheetsResult.ok ? (
        <section className="panel flash-banner error"><strong>Tagesblaetter konnten nicht geladen werden.</strong><p>{sheetsResult.error}</p></section>
      ) : null}

      {canManage ? (
        options ? (
          <section className="panel">
            <p className="eyebrow">Neuer Entwurf</p>
            <h2>Tagesblatt mit erster Planzeile anlegen</h2>
            <form action={createWorkdaySheetAction} className="form-stack">
              <div className="form-grid">
                <label className="form-field"><span>Arbeitstag</span><input name="date" required type="date" /></label>
                <label className="form-field"><span>Titel (optional)</span><input name="title" placeholder="Zum Beispiel Team Nord · Dienstag" /></label>
                <label className="form-field">
                  <span>Team (optional)</span>
                  <select defaultValue="" name="teamId"><option value="">Kein Team</option>{options.teams.map((team) => <option key={team.id} value={team.id}>{team.name} · {team.memberCount} Mitglieder</option>)}</select>
                </label>
                <label className="form-field">
                  <span>WORKER (optional)</span>
                  <select defaultValue="" name="workerUserId"><option value="">Kein direkter WORKER</option>{options.workers.map((worker) => <option key={worker.id} value={worker.id}>{worker.name}</option>)}</select>
                </label>
                <label className="form-field full-span"><span>Interne Office-Notizen</span><textarea name="internalNotes" rows={3} /></label>
              </div>
              <div className="worksheet-row-card">
                <p className="eyebrow">Erste Planzeile</p>
                <div className="form-grid">
                  <label className="form-field"><span>Beginn (optional)</span><input name="startTime" type="time" /></label>
                  <label className="form-field"><span>Ende (optional)</span><input name="endTime" type="time" /></label>
                  <label className="form-field full-span"><span>Geplante Arbeit</span><textarea name="plannedText" placeholder="07:00 Musterstr. 1 — Treppen + H.M.S." required rows={3} /></label>
                  <label className="form-field full-span"><span>Planhinweis</span><textarea name="notes" rows={2} /></label>
                  <WorkdaySheetRelationFields options={options} />
                </div>
              </div>
              <p className="muted-note">Mindestens Team oder direkter WORKER muss vor dem Senden gesetzt sein. Der Entwurf bleibt bis dahin flexibel.</p>
              <div className="form-actions"><button className="primary-button" type="submit">Entwurf anlegen</button></div>
            </form>
          </section>
        ) : (
          <section className="panel flash-banner error"><strong>Planungsoptionen fehlen.</strong><p>{optionsResult?.error}</p></section>
        )
      ) : (
        <section className="panel">
          <p className="eyebrow">Meine Ausfuehrung</p>
          <h2>Zugewiesene Tagesblaetter</h2>
          <p>Du siehst nur gesendete oder spaetere Blaetter, die dir direkt oder ueber eines deiner Teams zugewiesen sind.</p>
        </section>
      )}

      <section className="panel">
        <div className="row-spread"><div><p className="eyebrow">Uebersicht</p><h2>{canManage ? 'Tagesblaetter der Firma' : 'Meine Tagesblaetter'}</h2></div><span className="inline-chip">{sheets.length}</span></div>
        {sheets.length ? (
          <div className="table-shell">
            <table className="jobs-table">
              <thead><tr><th>Tag / Titel</th><th>Zuweisung</th><th>Status</th><th>Fortschritt</th><th>Aktion</th></tr></thead>
              <tbody>{sheets.map((sheet) => (
                <tr key={sheet.id}>
                  <td><strong>{formatDate(sheet.date)}</strong><span>{sheet.title ?? 'Tagesblatt ohne Titel'}</span></td>
                  <td><strong>{sheet.worker?.name ?? sheet.team?.name ?? 'Noch offen'}</strong><span>{sheet.worker && sheet.team ? `zusaetzlich ${sheet.team.name}` : 'Direkt oder Team'}</span></td>
                  <td><span className="status-pill">{getWorkdaySheetStatusLabel(sheet.status)}</span></td>
                  <td><strong>{sheet.completedRowCount} / {sheet.rowCount}</strong><span>Ist-Texte erfasst</span></td>
                  <td><Link className="table-action" href={`/workday-sheets/${sheet.id}`}>Oeffnen</Link></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <p>Noch keine sichtbaren Tagesblaetter vorhanden.</p>}
      </section>
    </main>
  );
}
