import type {
  AssignmentEntityOptionsResponse,
  AssignmentEntityType,
  AssignmentStatus,
} from '@einsatzpilot/types';

import {
  createAssignmentAction,
  updateAssignmentAction,
} from '../../../lib/assignment-actions';
import {
  getAssignmentEntityOptionsData,
  getAssignmentEntityTypeLabel,
  getAssignmentKindLabel,
  getAssignmentsData,
  getAssignmentStatusLabel,
} from '../../../lib/assignments';
import { formatDateTime, toDateTimeLocalValue } from '../../../lib/operations';
import { requireServerSession } from '../../../lib/server-auth';

const entityTypes: AssignmentEntityType[] = [
  'USER',
  'TEAM',
  'JOB',
  'CUSTOMER',
  'ADDRESS',
  'OBJECT',
  'OBJECT_AREA',
  'ITEM',
];

const assignmentKinds = [
  ['RESPONSIBLE', 'Verantwortlich'],
  ['SCHEDULED', 'Eingeplant'],
  ['ALLOCATED', 'Zugeteilt'],
  ['RESERVED', 'Reserviert'],
  ['SUPPORTING', 'Unterstuetzend'],
  ['OTHER', 'Sonstige'],
] as const;

const noticeLabels: Record<string, string> = {
  'assignment-created': 'Die Zuweisung wurde angelegt.',
  'assignment-updated': 'Die Zuweisung wurde aktualisiert.',
};

const statusTargets: Record<AssignmentStatus, AssignmentStatus[]> = {
  PLANNED: ['PLANNED', 'ACTIVE', 'CANCELED'],
  ACTIVE: ['ACTIVE', 'ENDED', 'CANCELED'],
  ENDED: ['ENDED'],
  CANCELED: ['CANCELED'],
};

function EntityOptions({
  entities,
}: {
  entities: AssignmentEntityOptionsResponse['entities'];
}) {
  return entityTypes.map((type) =>
    entities[type].length ? (
      <optgroup key={type} label={getAssignmentEntityTypeLabel(type)}>
        {entities[type].map((entity) => (
          <option key={`${type}:${entity.id}`} value={`${type}:${entity.id}`}>
            {entity.label}{entity.detail ? ` · ${entity.detail}` : ''}
          </option>
        ))}
      </optgroup>
    ) : null,
  );
}

export default async function AssignmentsPage({
  searchParams,
}: {
  searchParams?: Promise<{ notice?: string; error?: string }>;
}) {
  const [session, assignmentsResult, optionsResult, params] = await Promise.all([
    requireServerSession(),
    getAssignmentsData(),
    getAssignmentEntityOptionsData(),
    searchParams,
  ]);
  const assignments = assignmentsResult.data?.assignments ?? [];
  const entities = optionsResult.data?.entities;
  const canWrite = session.membershipRole === 'OWNER' || session.membershipRole === 'OFFICE';
  const flash = params?.error
    ? { tone: 'error', text: params.error }
    : params?.notice && noticeLabels[params.notice]
      ? { tone: 'success', text: noticeLabels[params.notice] }
      : null;

  return (
    <main className="content-page">
      <section className="hero-card">
        <p className="eyebrow">Zuweisungsstamm</p>
        <h1>Generische Zuweisungen</h1>
        <p>
          Zuweisungen verbinden vorhandene Firmendatensaetze. Sie ersetzen weder die aktuelle
          Teamzuordnung am Auftrag noch Bewegungs-, Bestands- oder Dispositionsprozesse.
        </p>
      </section>

      {flash ? (
        <section className={`panel flash-banner ${flash.tone === 'error' ? 'error' : 'success'}`}>
          <strong>{flash.tone === 'error' ? 'Aktion fehlgeschlagen' : 'Aktion gespeichert'}</strong>
          <p>{flash.text}</p>
        </section>
      ) : null}

      {!assignmentsResult.ok || !optionsResult.ok ? (
        <section className="panel flash-banner error">
          <strong>Zuweisungsdaten konnten nicht vollstaendig geladen werden.</strong>
          <p>{assignmentsResult.error ?? optionsResult.error}</p>
        </section>
      ) : null}

      {canWrite && entities ? (
        <section className="panel">
          <p className="eyebrow">Neue Zuweisung</p>
          <h2>Datensaetze verbinden</h2>
          <form action={createAssignmentAction} className="form-stack">
            <div className="form-grid">
              <label className="form-field">
                <span>Quelle</span>
                <select defaultValue="" name="source" required>
                  <option disabled value="">Quelle auswaehlen</option>
                  <EntityOptions entities={entities} />
                </select>
              </label>
              <label className="form-field">
                <span>Ziel</span>
                <select defaultValue="" name="target" required>
                  <option disabled value="">Ziel auswaehlen</option>
                  <EntityOptions entities={entities} />
                </select>
              </label>
              <label className="form-field">
                <span>Art</span>
                <select defaultValue="ALLOCATED" name="kind">
                  {assignmentKinds.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label className="form-field">
                <span>Status</span>
                <select defaultValue="ACTIVE" name="status">
                  <option value="ACTIVE">Aktiv</option>
                  <option value="PLANNED">Geplant</option>
                </select>
              </label>
              <label className="form-field"><span>Beginn</span><input name="startsAt" type="datetime-local" /></label>
              <label className="form-field"><span>Ende</span><input name="endsAt" type="datetime-local" /></label>
              <label className="form-field full-span"><span>Notizen</span><textarea name="notes" rows={3} /></label>
            </div>
            <p className="muted-note">Quelle, Ziel und Art bleiben nach dem Anlegen unveraendert. Ende muss nach Beginn liegen.</p>
            <div className="form-actions"><button className="primary-button" type="submit">Zuweisung anlegen</button></div>
          </form>
        </section>
      ) : null}

      {!canWrite ? (
        <section className="panel"><p>Ihre Rolle darf Zuweisungen lesen, aber nicht bearbeiten.</p></section>
      ) : null}

      <section className="panel">
        <p className="eyebrow">Zuweisungen</p>
        <h2>{assignments.length} Datensaetze</h2>
        <div className="team-grid">
          {assignments.map((assignment) => (
            <article className="team-card" key={assignment.id}>
              <div className="row-spread">
                <div>
                  <strong>{assignment.source.label} {'->'} {assignment.target.label}</strong>
                  <p className="compact-text">
                    {getAssignmentEntityTypeLabel(assignment.sourceType)} {'->'} {getAssignmentEntityTypeLabel(assignment.targetType)} · {getAssignmentKindLabel(assignment.kind)}
                  </p>
                </div>
                <span className="inline-chip">{getAssignmentStatusLabel(assignment.status)}</span>
              </div>
              <p className="compact-text">
                {assignment.startsAt ? formatDateTime(assignment.startsAt) : 'Ohne Beginn'} · {assignment.endsAt ? formatDateTime(assignment.endsAt) : 'Ohne Ende'}
              </p>
              <p className="compact-text">Angelegt von {assignment.createdBy.name}</p>
              {assignment.notes ? <p className="compact-text">{assignment.notes}</p> : null}
              {canWrite ? (
                <form action={updateAssignmentAction.bind(null, assignment.id)} className="form-stack nested-stack">
                  <div className="form-grid">
                    <label className="form-field">
                      <span>Status</span>
                      <select defaultValue={assignment.status} name="status">
                        {statusTargets[assignment.status].map((status) => <option key={status} value={status}>{getAssignmentStatusLabel(status)}</option>)}
                      </select>
                    </label>
                    <label className="form-field"><span>Beginn</span><input defaultValue={toDateTimeLocalValue(assignment.startsAt)} name="startsAt" type="datetime-local" /></label>
                    <label className="form-field"><span>Ende</span><input defaultValue={toDateTimeLocalValue(assignment.endsAt)} name="endsAt" type="datetime-local" /></label>
                    <label className="form-field full-span"><span>Notizen</span><textarea defaultValue={assignment.notes ?? ''} name="notes" rows={3} /></label>
                  </div>
                  <div className="form-actions"><button className="secondary-button" type="submit">Zuweisung speichern</button></div>
                </form>
              ) : null}
            </article>
          ))}
          {assignments.length === 0 ? <p>Noch keine Zuweisungen vorhanden.</p> : null}
        </div>
      </section>
    </main>
  );
}
