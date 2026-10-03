import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  addRecurringDutyAction,
  transitionServiceAgreementAction,
  updateRecurringDutyAction,
  updateServiceAgreementAction,
} from '../../../../lib/service-agreement-actions';
import {
  getCadenceLabel,
  getServiceAgreementData,
  getServiceAgreementOptionsData,
  getServiceAgreementStatusLabel,
  getServiceAgreementStatusTone,
} from '../../../../lib/service-agreements';
import { requireServerSession } from '../../../../lib/server-auth';
import { RecurringDutyFields } from '../recurring-duty-fields';
import { ServiceAgreementRelationFields } from '../service-agreement-relation-fields';

const notices: Record<string, string> = {
  'agreement-created': 'Die Leistungsvereinbarung wurde als Entwurf angelegt.',
  'agreement-updated': 'Die Leistungsvereinbarung wurde aktualisiert.',
  'agreement-activated': 'Die Leistungsvereinbarung ist aktiv.',
  'agreement-deactivated': 'Die Leistungsvereinbarung wurde deaktiviert und kann bearbeitet werden.',
  'agreement-archived': 'Die Leistungsvereinbarung wurde dauerhaft archiviert.',
  'duty-created': 'Die wiederkehrende Pflicht wurde hinzugefügt.',
  'duty-updated': 'Die wiederkehrende Pflicht wurde aktualisiert.',
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeZone: 'UTC' }).format(
    new Date(`${value}T00:00:00.000Z`),
  );
}

function formatDateTime(value?: string) {
  return value
    ? new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
    : '–';
}

export default async function ServiceAgreementDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ agreementId: string }>;
  searchParams?: Promise<{ error?: string; notice?: string }>;
}) {
  const [session, route, query] = await Promise.all([
    requireServerSession(),
    params,
    searchParams,
  ]);
  const canManage = session.membershipRole === 'OWNER' || session.membershipRole === 'OFFICE';
  if (!canManage) {
    return (
      <main className="content-page">
        <section className="panel flash-banner error"><strong>Kein Zugriff</strong><p>Leistungsvereinbarungen sind nur für OWNER und OFFICE sichtbar.</p></section>
      </main>
    );
  }

  const [agreementResult, optionsResult] = await Promise.all([
    getServiceAgreementData(route.agreementId),
    getServiceAgreementOptionsData(),
  ]);
  if (agreementResult.status === 404) notFound();
  const agreement = agreementResult.data?.serviceAgreement;
  const options = optionsResult.data;
  if (!agreement) {
    return (
      <main className="content-page">
        <section className="panel flash-banner error"><strong>Vereinbarung konnte nicht geladen werden.</strong><p>{agreementResult.error}</p></section>
        <Link className="secondary-link" href="/service-agreements">Zur Übersicht</Link>
      </main>
    );
  }
  const editable = agreement.status === 'DRAFT' || agreement.status === 'INACTIVE';

  return (
    <main className="content-page">
      <section className="hero-card">
        <p className="eyebrow">Leistungsvereinbarung</p>
        <div className="row-spread">
          <div><h1>{agreement.title}</h1><p>{agreement.description ?? 'Wiederkehrende Pflichten ohne zusätzliche Beschreibung.'}</p></div>
          <span className={`status-pill ${getServiceAgreementStatusTone(agreement.status)}`}>{getServiceAgreementStatusLabel(agreement.status)}</span>
        </div>
        <Link className="secondary-link" href="/service-agreements">Zur Vereinbarungsliste</Link>
      </section>

      {query?.notice && notices[query.notice] ? (
        <section className="panel flash-banner success"><strong>Gespeichert</strong><p>{notices[query.notice]}</p></section>
      ) : null}
      {query?.error ? (
        <section className="panel flash-banner error"><strong>Aktion fehlgeschlagen</strong><p>{query.error}</p></section>
      ) : null}
      {!optionsResult.ok ? (
        <section className="panel flash-banner error"><strong>Stammdatenoptionen fehlen.</strong><p>{optionsResult.error}</p></section>
      ) : null}

      <section className="panel">
        <div className="row-spread">
          <div><p className="eyebrow">Steuerung</p><h2>Lebenszyklus</h2></div>
          <div className="form-actions">
            {agreement.status === 'DRAFT' || agreement.status === 'INACTIVE' ? (
              <form action={transitionServiceAgreementAction.bind(null, agreement.id, 'ACTIVE')}><button className="primary-button" type="submit">Aktivieren</button></form>
            ) : null}
            {agreement.status === 'ACTIVE' ? (
              <form action={transitionServiceAgreementAction.bind(null, agreement.id, 'INACTIVE')}><button className="secondary-button" type="submit">Deaktivieren</button></form>
            ) : null}
            {agreement.status === 'DRAFT' || agreement.status === 'INACTIVE' ? (
              <form action={transitionServiceAgreementAction.bind(null, agreement.id, 'ARCHIVED')}><button className="secondary-button" type="submit">Archivieren</button></form>
            ) : null}
          </div>
        </div>
        <p className="muted-note">
          Aktive Definitionen sind gesperrt. Zum Ändern zuerst deaktivieren. Archivierte
          Vereinbarungen bleiben lesbar und sind terminal.
        </p>
      </section>

      <section className="panel agreement-facts">
        <div><span>Gültigkeit</span><strong>{formatDate(agreement.effectiveFrom)}{agreement.effectiveUntil ? ` – ${formatDate(agreement.effectiveUntil)}` : ' – offen'}</strong></div>
        <div><span>Zeitzone</span><strong>{agreement.timezone}</strong></div>
        <div><span>Kunde</span><strong>{agreement.customer?.name ?? 'Nicht gesetzt'}</strong></div>
        <div><span>Adresse</span><strong>{agreement.address ? `${agreement.address.label} · ${agreement.address.postalCode} ${agreement.address.city}` : 'Nicht gesetzt'}</strong></div>
        <div><span>Objekt</span><strong>{agreement.object?.name ?? 'Nicht gesetzt'}</strong></div>
        <div><span>Bereich</span><strong>{agreement.objectArea?.name ?? 'Nicht gesetzt'}</strong></div>
      </section>

      {editable && options ? (
        <section className="panel">
          <p className="eyebrow">Definition</p><h2>Vereinbarung bearbeiten</h2>
          <form action={updateServiceAgreementAction.bind(null, agreement.id)} className="form-stack">
            <div className="form-grid">
              <label className="form-field full-span"><span>Titel</span><input defaultValue={agreement.title} name="title" required /></label>
              <label className="form-field full-span"><span>Beschreibung</span><textarea defaultValue={agreement.description ?? ''} name="description" rows={3} /></label>
              <label className="form-field"><span>Gültig ab</span><input defaultValue={agreement.effectiveFrom} name="effectiveFrom" required type="date" /></label>
              <label className="form-field"><span>Gültig bis</span><input defaultValue={agreement.effectiveUntil ?? ''} name="effectiveUntil" type="date" /></label>
              <label className="form-field full-span"><span>IANA-Zeitzone</span><input defaultValue={agreement.timezone} name="timezone" required /></label>
              <ServiceAgreementRelationFields agreement={agreement} options={options} />
              <label className="form-field full-span"><span>Interne Notizen</span><textarea defaultValue={agreement.internalNotes ?? ''} name="internalNotes" rows={3} /></label>
            </div>
            <div className="form-actions"><button className="primary-button" type="submit">Vereinbarung speichern</button></div>
          </form>
        </section>
      ) : (
        <section className="panel">
          <p className="eyebrow">Schreibschutz</p><h2>{agreement.status === 'ACTIVE' ? 'Aktive Definition' : 'Archivierte Definition'}</h2>
          <p>{agreement.status === 'ACTIVE' ? 'Diese Vereinbarung muss vor Änderungen deaktiviert werden.' : 'Dieser Stand bleibt als lesbare historische Definition erhalten.'}</p>
          {agreement.internalNotes ? <div className="internal-note"><strong>Interne Notizen</strong><p>{agreement.internalNotes}</p></div> : null}
        </section>
      )}

      <section className="panel">
        <div className="row-spread"><div><p className="eyebrow">Pflichten</p><h2>Wiederkehrende Planzeilen</h2></div><span className="inline-chip">{agreement.activeDutyCount} / {agreement.dutyCount} aktiv</span></div>
        <div className="agreement-duty-list">
          {agreement.duties.map((duty) => (
            <article className={`agreement-duty-card${duty.isActive ? '' : ' inactive'}`} key={duty.id}>
              <div className="row-spread">
                <div><p className="eyebrow">Pflicht {duty.position + 1}</p><h3>{duty.plannedText}</h3></div>
                <span className={`status-pill ${duty.isActive ? 'done' : 'archived'}`}>{duty.isActive ? 'Aktiv' : 'Inaktiv'}</span>
              </div>
              <p><strong>{getCadenceLabel(duty.cadenceUnit, duty.cadenceInterval)}</strong> · erstmals {formatDate(duty.firstDueDate)}{duty.startTime ? ` · ${duty.startTime}${duty.endTime ? `–${duty.endTime}` : ''}` : ''}</p>
              {duty.notes ? <p className="muted-note">{duty.notes}</p> : null}
              {editable ? (
                <details>
                  <summary>Pflicht bearbeiten</summary>
                  <form action={updateRecurringDutyAction.bind(null, agreement.id, duty.id)} className="form-stack agreement-duty-form">
                    <RecurringDutyFields duty={duty} />
                    <div className="form-actions"><button className="secondary-button" type="submit">Pflicht speichern</button></div>
                  </form>
                </details>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      {editable ? (
        <section className="panel">
          <p className="eyebrow">Weitere Pflicht</p><h2>Stabile Planzeile ergänzen</h2>
          <form action={addRecurringDutyAction.bind(null, agreement.id)} className="form-stack">
            <RecurringDutyFields defaultFirstDueDate={agreement.effectiveFrom} />
            <div className="form-actions"><button className="primary-button" type="submit">Pflicht hinzufügen</button></div>
          </form>
        </section>
      ) : null}

      <section className="panel agreement-facts">
        <div><span>Erstellt von</span><strong>{agreement.createdBy.name}</strong></div>
        <div><span>Zuletzt geändert von</span><strong>{agreement.updatedBy.name}</strong></div>
        <div><span>Aktiviert</span><strong>{formatDateTime(agreement.activatedAt)}{agreement.activatedBy ? ` · ${agreement.activatedBy.name}` : ''}</strong></div>
        <div><span>Deaktiviert</span><strong>{formatDateTime(agreement.deactivatedAt)}{agreement.deactivatedBy ? ` · ${agreement.deactivatedBy.name}` : ''}</strong></div>
        <div><span>Archiviert</span><strong>{formatDateTime(agreement.archivedAt)}{agreement.archivedBy ? ` · ${agreement.archivedBy.name}` : ''}</strong></div>
      </section>
    </main>
  );
}
