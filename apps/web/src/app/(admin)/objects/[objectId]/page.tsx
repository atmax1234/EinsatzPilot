import Link from 'next/link';

import {
  createObjectAreaAction,
  updateObjectAction,
  updateObjectAreaAction,
} from '../../../../lib/directory-actions';
import {
  formatAddress,
  getAddressesData,
  getCustomersData,
  getObjectAreaTypeLabel,
  getObjectDetailData,
  getObjectStatusLabel,
  getObjectTypeLabel,
} from '../../../../lib/directory';
import { requireServerSession } from '../../../../lib/server-auth';

const objectTypes = [
  ['BUILDING', 'Gebaeude'], ['GARDEN', 'Garten'], ['WAREHOUSE', 'Lager'],
  ['CONSTRUCTION_SITE', 'Baustelle'], ['OFFICE', 'Buero'], ['FACILITY', 'Betriebsstaette'],
  ['OTHER', 'Sonstiges Objekt'],
] as const;
const areaTypes = [
  ['STAIRCASE', 'Treppenhaus'], ['BASEMENT', 'Keller'], ['ENTRANCE', 'Eingang'],
  ['PARKING', 'Parkplatz'], ['GARDEN_AREA', 'Gartenbereich'], ['ROOM', 'Raum'],
  ['STORAGE_AREA', 'Lagerbereich'], ['OTHER', 'Sonstiger Bereich'],
] as const;
const noticeLabels: Record<string, string> = {
  'object-created': 'Das Objekt wurde angelegt.',
  'object-updated': 'Das Objekt wurde aktualisiert.',
  'area-created': 'Der Objektbereich wurde angelegt.',
  'area-updated': 'Der Objektbereich wurde aktualisiert.',
};

export default async function ObjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ objectId: string }>;
  searchParams?: Promise<{ notice?: string; error?: string }>;
}) {
  const { objectId } = await params;
  const [session, objectResult, customersResult, addressesResult, query] = await Promise.all([
    requireServerSession(),
    getObjectDetailData(objectId),
    getCustomersData(),
    getAddressesData(),
    searchParams,
  ]);
  const object = objectResult.data?.object;
  const customers = customersResult.data?.customers ?? [];
  const addresses = addressesResult.data?.addresses ?? [];
  const canWrite = session.membershipRole === 'OWNER' || session.membershipRole === 'OFFICE';
  const flash = query?.error
    ? { tone: 'error', text: query.error }
    : query?.notice && noticeLabels[query.notice]
      ? { tone: 'success', text: noticeLabels[query.notice] }
      : null;

  if (!objectResult.ok || !object) {
    return (
      <main className="content-page">
        <section className="panel flash-banner error">
          <strong>Objekt konnte nicht geladen werden.</strong>
          <p>{objectResult.error ?? 'Unbekannter Fehler.'}</p>
          <Link href="/objects">Zur Objektliste</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="content-page">
      <section className="hero-card">
        <p className="eyebrow">Objektdetail</p>
        <h1>{object.name}</h1>
        <p>{getObjectTypeLabel(object.type)} · {getObjectStatusLabel(object.status)} · {object.customer?.name ?? 'Ohne Kunde'}</p>
        <div className="action-row"><Link href="/objects">Zur Objektliste</Link><Link href="/customers">Kunden und Adressen</Link></div>
      </section>

      {flash ? <section className={`panel flash-banner ${flash.tone}`}><strong>{flash.tone === 'error' ? 'Aktion fehlgeschlagen' : 'Aktion gespeichert'}</strong><p>{flash.text}</p></section> : null}

      <section className="content-grid">
        <article className="panel">
          <p className="eyebrow">Stammdaten</p>
          <h2>{object.address ? formatAddress(object.address) : 'Keine Adresse zugeordnet'}</h2>
          {object.notes ? <p>{object.notes}</p> : <p>Keine Notizen hinterlegt.</p>}
          {canWrite ? (
            <form action={updateObjectAction.bind(null, object.id)} className="form-stack">
              <div className="form-grid">
                <label className="form-field full-span"><span>Name</span><input defaultValue={object.name} name="name" required /></label>
                <label className="form-field"><span>Typ</span><select defaultValue={object.type} name="type">{objectTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                <label className="form-field"><span>Status</span><select defaultValue={object.status} name="status"><option value="ACTIVE">Aktiv</option><option value="INACTIVE">Inaktiv</option></select></label>
                <label className="form-field"><span>Kunde</span><select defaultValue={object.customer?.id ?? ''} name="customerId"><option value="">Ohne Kunde</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label>
                <label className="form-field"><span>Adresse</span><select defaultValue={object.address?.id ?? ''} name="addressId"><option value="">Ohne Adresse</option>{addresses.map((address) => <option key={address.id} value={address.id}>{address.label} · {address.city}</option>)}</select></label>
                <label className="form-field full-span"><span>Notizen</span><textarea defaultValue={object.notes ?? ''} name="notes" rows={4} /></label>
              </div>
              <div className="form-actions"><button className="secondary-button" type="submit">Objekt speichern</button></div>
            </form>
          ) : null}
        </article>

        <article className="panel">
          <p className="eyebrow">Neuer Bereich</p>
          <h2>Objekt unterteilen</h2>
          {canWrite ? (
            <form action={createObjectAreaAction.bind(null, object.id)} className="form-stack">
              <div className="form-grid">
                <label className="form-field full-span"><span>Name</span><input name="name" placeholder="Zum Beispiel Eingang A" required /></label>
                <label className="form-field"><span>Typ</span><select defaultValue="OTHER" name="type">{areaTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                <label className="form-field full-span"><span>Notizen</span><textarea name="notes" rows={3} /></label>
              </div>
              <div className="form-actions"><button className="primary-button" type="submit">Bereich anlegen</button></div>
            </form>
          ) : <p>Ihre Rolle darf Bereiche lesen, aber nicht bearbeiten.</p>}
        </article>
      </section>

      <section className="panel">
        <p className="eyebrow">Objektbereiche</p>
        <h2>{object.areas.length} Bereiche</h2>
        <div className="team-grid">
          {object.areas.map((area) => (
            <article className="team-card" key={area.id}>
              <strong>{area.name}</strong>
              <p className="compact-text">{getObjectAreaTypeLabel(area.type)}</p>
              {canWrite ? (
                <form action={updateObjectAreaAction.bind(null, object.id, area.id)} className="form-stack nested-stack">
                  <div className="form-grid">
                    <label className="form-field full-span"><span>Name</span><input defaultValue={area.name} name="name" required /></label>
                    <label className="form-field"><span>Typ</span><select defaultValue={area.type} name="type">{areaTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                    <label className="form-field full-span"><span>Notizen</span><textarea defaultValue={area.notes ?? ''} name="notes" rows={3} /></label>
                  </div>
                  <div className="form-actions"><button className="secondary-button" type="submit">Bereich speichern</button></div>
                </form>
              ) : area.notes ? <p>{area.notes}</p> : null}
            </article>
          ))}
          {object.areas.length === 0 ? <p>Noch keine Bereiche vorhanden.</p> : null}
        </div>
      </section>
    </main>
  );
}
