import Link from 'next/link';

import type { ServiceAgreementStatus } from '@einsatzpilot/types';

import { createServiceAgreementAction } from '../../../lib/service-agreement-actions';
import {
  getServiceAgreementOptionsData,
  getServiceAgreementsData,
  getServiceAgreementStatusLabel,
  getServiceAgreementStatusTone,
} from '../../../lib/service-agreements';
import { requireServerSession } from '../../../lib/server-auth';
import { RecurringDutyFields } from './recurring-duty-fields';
import { ServiceAgreementRelationFields } from './service-agreement-relation-fields';

const statuses: ServiceAgreementStatus[] = ['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED'];

function formatDate(value: string) {
  return new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeZone: 'UTC' }).format(
    new Date(`${value}T00:00:00.000Z`),
  );
}

function isStatus(value?: string): value is ServiceAgreementStatus {
  return Boolean(value && statuses.includes(value as ServiceAgreementStatus));
}

export default async function ServiceAgreementsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    error?: string;
    status?: string;
    customerId?: string;
    objectId?: string;
  }>;
}) {
  const [session, params] = await Promise.all([requireServerSession(), searchParams]);
  const canManage = session.membershipRole === 'OWNER' || session.membershipRole === 'OFFICE';

  if (!canManage) {
    return (
      <main className="content-page">
        <section className="hero-card">
          <p className="eyebrow">Leistungsvereinbarungen</p>
          <h1>Office-Verantwortung und wiederkehrende Pflichten</h1>
          <p>
            Vereinbarungsdefinitionen und interne Planungshinweise sind in dieser Phase nur für
            OWNER und OFFICE sichtbar. Arbeiter erhalten daraus noch keine automatische Planung.
          </p>
        </section>
        <section className="panel flash-banner error">
          <strong>Kein Zugriff</strong>
          <p>Ihre Rolle darf Leistungsvereinbarungen weder lesen noch bearbeiten.</p>
        </section>
      </main>
    );
  }

  const filters = {
    status: isStatus(params?.status) ? params.status : undefined,
    customerId: params?.customerId || undefined,
    objectId: params?.objectId || undefined,
  };
  const [agreementsResult, optionsResult] = await Promise.all([
    getServiceAgreementsData(filters),
    getServiceAgreementOptionsData(),
  ]);
  const agreements = agreementsResult.data?.serviceAgreements ?? [];
  const options = optionsResult.data;
  const hasFilters = Boolean(filters.status || filters.customerId || filters.objectId);

  return (
    <main className="content-page">
      <section className="hero-card">
        <p className="eyebrow">Phase 10 · Leistungsvereinbarungen</p>
        <h1>Wiederkehrende Verantwortung sauber definieren</h1>
        <p>
          Vereinbarungen beschreiben erwartete Pflichten und ihren Rhythmus. Sie sind kontrollierte
          Planungsgrundlagen – keine automatisch erzeugten Aufträge oder Tageszettel.
        </p>
      </section>

      {params?.error ? (
        <section className="panel flash-banner error">
          <strong>Aktion fehlgeschlagen</strong><p>{params.error}</p>
        </section>
      ) : null}
      {!agreementsResult.ok || !optionsResult.ok ? (
        <section className="panel flash-banner error">
          <strong>Leistungsvereinbarungen konnten nicht vollständig geladen werden.</strong>
          <p>{agreementsResult.error ?? optionsResult.error}</p>
        </section>
      ) : null}

      <section className="panel">
        <div className="row-spread">
          <div><p className="eyebrow">Filtern</p><h2>Vereinbarungen eingrenzen</h2></div>
          {hasFilters ? <Link className="secondary-link" href="/service-agreements">Filter zurücksetzen</Link> : null}
        </div>
        <form className="form-stack" method="get">
          <div className="form-grid">
            <label className="form-field">
              <span>Status</span>
              <select defaultValue={filters.status ?? ''} name="status">
                <option value="">Alle Status</option>
                {statuses.map((status) => <option key={status} value={status}>{getServiceAgreementStatusLabel(status)}</option>)}
              </select>
            </label>
            <label className="form-field">
              <span>Kunde</span>
              <select defaultValue={filters.customerId ?? ''} name="customerId">
                <option value="">Alle Kunden</option>
                {options?.customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
              </select>
            </label>
            <label className="form-field">
              <span>Objekt</span>
              <select defaultValue={filters.objectId ?? ''} name="objectId">
                <option value="">Alle Objekte</option>
                {options?.objects.map((object) => <option key={object.id} value={object.id}>{object.name}</option>)}
              </select>
            </label>
          </div>
          <div className="form-actions"><button className="secondary-button" type="submit">Filter anwenden</button></div>
        </form>
      </section>

      {options ? (
        <section className="panel">
          <p className="eyebrow">Neue Grundlage</p>
          <h2>Vereinbarung mit erster Pflicht anlegen</h2>
          <form action={createServiceAgreementAction} className="form-stack">
            <div className="form-grid">
              <label className="form-field full-span"><span>Titel</span><input name="title" placeholder="Treppenhauspflege Musterstraße" required /></label>
              <label className="form-field full-span"><span>Beschreibung (optional)</span><textarea name="description" rows={3} /></label>
              <label className="form-field"><span>Gültig ab</span><input name="effectiveFrom" required type="date" /></label>
              <label className="form-field"><span>Gültig bis (optional)</span><input name="effectiveUntil" type="date" /></label>
              <label className="form-field full-span"><span>IANA-Zeitzone</span><input defaultValue="Europe/Berlin" name="timezone" required /></label>
              <ServiceAgreementRelationFields options={options} />
              <label className="form-field full-span"><span>Interne Notizen (optional)</span><textarea name="internalNotes" rows={3} /></label>
            </div>
            <div className="agreement-duty-card">
              <p className="eyebrow">Erste wiederkehrende Pflicht</p>
              <RecurringDutyFields />
            </div>
            <p className="muted-note">
              Die erste Fälligkeit muss im Gültigkeitszeitraum liegen. Aktivierung und spätere
              Tagesplanung bleiben bewusste Office-Schritte.
            </p>
            <div className="form-actions"><button className="primary-button" type="submit">Entwurf anlegen</button></div>
          </form>
        </section>
      ) : null}

      <section className="panel">
        <div className="row-spread">
          <div><p className="eyebrow">Übersicht</p><h2>Leistungsvereinbarungen</h2></div>
          <span className="inline-chip">{agreements.length}</span>
        </div>
        {agreements.length ? (
          <div className="table-shell">
            <table className="jobs-table">
              <thead><tr><th>Vereinbarung</th><th>Kontext</th><th>Gültigkeit</th><th>Pflichten</th><th>Status</th><th>Aktion</th></tr></thead>
              <tbody>
                {agreements.map((agreement) => (
                  <tr key={agreement.id}>
                    <td><strong>{agreement.title}</strong><span>{agreement.timezone}</span></td>
                    <td><strong>{agreement.object?.name ?? agreement.customer?.name ?? 'Freie Grundlage'}</strong><span>{agreement.objectArea?.name ?? agreement.address?.label ?? 'Ohne weiteren Kontext'}</span></td>
                    <td><strong>{formatDate(agreement.effectiveFrom)}</strong><span>{agreement.effectiveUntil ? `bis ${formatDate(agreement.effectiveUntil)}` : 'ohne Enddatum'}</span></td>
                    <td><strong>{agreement.activeDutyCount} aktiv</strong><span>{agreement.dutyCount} insgesamt</span></td>
                    <td><span className={`status-pill ${getServiceAgreementStatusTone(agreement.status)}`}>{getServiceAgreementStatusLabel(agreement.status)}</span></td>
                    <td><Link className="table-action" href={`/service-agreements/${agreement.id}`}>Öffnen</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="worksheet-empty-state">
            <h3>{hasFilters ? 'Keine passenden Vereinbarungen' : 'Noch keine Leistungsvereinbarungen'}</h3>
            <p>{hasFilters ? 'Die gewählten Filter liefern keine Ergebnisse.' : 'Lege oben die erste wiederkehrende Verantwortungsgrundlage an.'}</p>
          </div>
        )}
      </section>
    </main>
  );
}
