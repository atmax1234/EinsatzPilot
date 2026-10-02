import Link from 'next/link';

import type { WorkdaySheetStatus } from '@einsatzpilot/types';

import { createWorkdaySheetAction } from '../../../lib/workday-sheet-actions';
import {
  getWorkdaySheetOptionsData,
  getWorkdaySheetsData,
  getWorkdaySheetStatusLabel,
  getWorkdaySheetStatusTone,
} from '../../../lib/workday-sheets';
import { requireServerSession } from '../../../lib/server-auth';
import { WorkdaySheetRelationFields } from './workday-sheet-relation-fields';

const statuses: WorkdaySheetStatus[] = [
  'DRAFT',
  'SENT',
  'SUBMITTED',
  'REVIEWED',
  'ARCHIVED',
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeZone: 'UTC' }).format(
    new Date(`${value}T00:00:00.000Z`),
  );
}
function isStatus(value: string | undefined): value is WorkdaySheetStatus {
  return Boolean(value && statuses.includes(value as WorkdaySheetStatus));
}

export default async function WorkdaySheetsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    error?: string;
    date?: string;
    status?: string;
    teamId?: string;
    workerUserId?: string;
  }>;
}) {
  const [session, params] = await Promise.all([requireServerSession(), searchParams]);
  const canManage = session.membershipRole === 'OWNER' || session.membershipRole === 'OFFICE';
  const filters = {
    date: params?.date || undefined,
    status: isStatus(params?.status) ? params.status : undefined,
    teamId: params?.teamId || undefined,
    workerUserId: params?.workerUserId || undefined,
  };
  const [sheetsResult, optionsResult] = await Promise.all([
    getWorkdaySheetsData(filters),
    canManage ? getWorkdaySheetOptionsData() : Promise.resolve(null),
  ]);
  const options = optionsResult?.data;
  const sheets = sheetsResult.data?.workdaySheets ?? [];
  const hasFilters = Boolean(
    filters.date || filters.status || filters.teamId || filters.workerUserId,
  );

  return (
    <main className="content-page">
      <section className="hero-card">
        <p className="eyebrow">Phase 8B · Tageszettel</p>
        <h1>Planung und Ausführung an einem Arbeitstag</h1>
        <p>
          Tageszettel verbinden freie Alltagsplanung mit der tatsächlichen Ausführung. Sie
          bleiben bewusst getrennt von strukturierten Aufträgen.
        </p>
        <Link className="secondary-link" href="/workday-sheets/today">
          Heutige Tageszettel öffnen
        </Link>
      </section>

      {params?.error ? (
        <section className="panel flash-banner error">
          <strong>Aktion fehlgeschlagen</strong>
          <p>{params.error}</p>
        </section>
      ) : null}
      {!sheetsResult.ok ? (
        <section className="panel flash-banner error">
          <strong>Tageszettel konnten nicht geladen werden.</strong>
          <p>{sheetsResult.error}</p>
        </section>
      ) : null}

      <section className="panel worksheet-filter-panel">
        <div className="row-spread">
          <div>
            <p className="eyebrow">Filtern</p>
            <h2>Sichtbare Tageszettel eingrenzen</h2>
          </div>
          {hasFilters ? (
            <Link className="secondary-link" href="/workday-sheets">
              Filter zurücksetzen
            </Link>
          ) : null}
        </div>
        <form className="form-stack" method="get">
          <div className="form-grid worksheet-filter-grid">
            <label className="form-field">
              <span>Arbeitstag</span>
              <input defaultValue={filters.date ?? ''} name="date" type="date" />
            </label>
            <label className="form-field">
              <span>Status</span>
              <select defaultValue={filters.status ?? ''} name="status">
                <option value="">Alle Status</option>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {getWorkdaySheetStatusLabel(status)}
                  </option>
                ))}
              </select>
            </label>
            {canManage && options ? (
              <>
                <label className="form-field">
                  <span>Team</span>
                  <select defaultValue={filters.teamId ?? ''} name="teamId">
                    <option value="">Alle Teams</option>
                    {options.teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form-field">
                  <span>Mitarbeiter</span>
                  <select defaultValue={filters.workerUserId ?? ''} name="workerUserId">
                    <option value="">Alle Mitarbeiter</option>
                    {options.workers.map((worker) => (
                      <option key={worker.id} value={worker.id}>
                        {worker.name}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            ) : null}
          </div>
          <div className="form-actions">
            <button className="secondary-button" type="submit">
              Filter anwenden
            </button>
          </div>
        </form>
      </section>

      {canManage ? (
        options ? (
          <section className="panel">
            <p className="eyebrow">Neuer Entwurf</p>
            <h2>Tageszettel mit erster Planzeile anlegen</h2>
            <form action={createWorkdaySheetAction} className="form-stack">
              <div className="form-grid">
                <label className="form-field">
                  <span>Arbeitstag</span>
                  <input name="date" required type="date" />
                </label>
                <label className="form-field">
                  <span>Titel (optional)</span>
                  <input name="title" placeholder="Zum Beispiel Team Nord · Dienstag" />
                </label>
                <label className="form-field">
                  <span>Team (optional)</span>
                  <select defaultValue="" name="teamId">
                    <option value="">Kein Team</option>
                    {options.teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name} · {team.memberCount} Mitglieder
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form-field">
                  <span>Mitarbeiter (optional)</span>
                  <select defaultValue="" name="workerUserId">
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
                  <textarea name="internalNotes" rows={3} />
                </label>
              </div>
              <div className="worksheet-row-card">
                <p className="eyebrow">Erste Planzeile</p>
                <div className="form-grid">
                  <label className="form-field">
                    <span>Beginn (optional)</span>
                    <input name="startTime" type="time" />
                  </label>
                  <label className="form-field">
                    <span>Ende (optional)</span>
                    <input name="endTime" type="time" />
                  </label>
                  <label className="form-field full-span">
                    <span>Geplante Arbeit</span>
                    <textarea
                      name="plannedText"
                      placeholder="07:00 Musterstr. 1 — Treppen + H.M.S."
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
              </div>
              <p className="muted-note">
                Vor dem Senden muss mindestens ein Team oder ein direkter Mitarbeiter gesetzt
                sein. Der Entwurf bleibt bis dahin flexibel.
              </p>
              <div className="form-actions">
                <button className="primary-button" type="submit">
                  Entwurf anlegen
                </button>
              </div>
            </form>
          </section>
        ) : (
          <section className="panel flash-banner error">
            <strong>Planungsoptionen fehlen.</strong>
            <p>{optionsResult?.error}</p>
          </section>
        )
      ) : (
        <section className="panel">
          <p className="eyebrow">Meine Ausführung</p>
          <h2>Zugewiesene Tageszettel</h2>
          <p>
            Du siehst ausschließlich gesendete oder spätere Tageszettel, die dir direkt oder
            über eines deiner Teams zugewiesen sind.
          </p>
        </section>
      )}

      <section className="panel">
        <div className="row-spread">
          <div>
            <p className="eyebrow">Übersicht</p>
            <h2>{canManage ? 'Tageszettel der Firma' : 'Meine Tageszettel'}</h2>
          </div>
          <span className="inline-chip">{sheets.length}</span>
        </div>
        {sheets.length ? (
          <div className="table-shell">
            <table className="jobs-table">
              <thead>
                <tr>
                  <th>Tag / Titel</th>
                  <th>Zuweisung</th>
                  <th>Status</th>
                  <th>Fortschritt</th>
                  <th>Aktion</th>
                </tr>
              </thead>
              <tbody>
                {sheets.map((sheet) => {
                  const progress = sheet.rowCount
                    ? Math.round((sheet.completedRowCount / sheet.rowCount) * 100)
                    : 0;
                  return (
                    <tr key={sheet.id}>
                      <td>
                        <strong>{formatDate(sheet.date)}</strong>
                        <span>{sheet.title ?? 'Tageszettel ohne Titel'}</span>
                      </td>
                      <td>
                        <strong>{sheet.worker?.name ?? 'Kein direkter Mitarbeiter'}</strong>
                        <span>{sheet.team ? `Team: ${sheet.team.name}` : 'Kein Team'}</span>
                      </td>
                      <td>
                        <span
                          className={`status-pill ${getWorkdaySheetStatusTone(sheet.status)}`}
                        >
                          {getWorkdaySheetStatusLabel(sheet.status)}
                        </span>
                      </td>
                      <td>
                        <strong>
                          {sheet.completedRowCount} / {sheet.rowCount} erledigt
                        </strong>
                        <span className="worksheet-progress" aria-label={`${progress} Prozent`}>
                          <i style={{ width: `${progress}%` }} />
                        </span>
                      </td>
                      <td>
                        <Link className="table-action" href={`/workday-sheets/${sheet.id}`}>
                          Öffnen
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="worksheet-empty-state">
            <h3>{hasFilters ? 'Keine passenden Tageszettel' : 'Noch keine Tageszettel'}</h3>
            <p>
              {hasFilters
                ? 'Die gewählten Filter liefern keine sichtbaren Ergebnisse.'
                : canManage
                  ? 'Lege oben den ersten Entwurf für einen Arbeitstag an.'
                  : 'Sobald das Office dir einen Tageszettel sendet, erscheint er hier.'}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
