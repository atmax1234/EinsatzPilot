import Link from 'next/link';

import { createObjectAction } from '../../../lib/directory-actions';
import {
  formatAddress,
  getAddressesData,
  getCustomersData,
  getObjectsData,
  getObjectStatusLabel,
  getObjectTypeLabel,
} from '../../../lib/directory';
import { requireServerSession } from '../../../lib/server-auth';

const objectTypes = [
  ['BUILDING', 'Gebaeude'],
  ['GARDEN', 'Garten'],
  ['WAREHOUSE', 'Lager'],
  ['CONSTRUCTION_SITE', 'Baustelle'],
  ['OFFICE', 'Buero'],
  ['FACILITY', 'Betriebsstaette'],
  ['OTHER', 'Sonstiges Objekt'],
] as const;

export default async function ObjectsPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const [session, objectsResult, customersResult, addressesResult, params] = await Promise.all([
    requireServerSession(),
    getObjectsData(),
    getCustomersData(),
    getAddressesData(),
    searchParams,
  ]);
  const objects = objectsResult.data?.objects ?? [];
  const customers = customersResult.data?.customers ?? [];
  const addresses = addressesResult.data?.addresses ?? [];
  const canWrite = session.membershipRole === 'OWNER' || session.membershipRole === 'OFFICE';

  return (
    <main className="content-page">
      <section className="hero-card">
        <p className="eyebrow">Objektstamm</p>
        <h1>Operative Orte und Einheiten</h1>
        <p>
          Objekte bilden stabile Einsatzorte oder verwaltete Einheiten ab. Bereiche
          werden innerhalb eines Objekts auf der Detailseite gepflegt.
        </p>
      </section>

      {params?.error ? (
        <section className="panel flash-banner error"><strong>Aktion fehlgeschlagen</strong><p>{params.error}</p></section>
      ) : null}

      {!objectsResult.ok || !customersResult.ok || !addressesResult.ok ? (
        <section className="panel flash-banner error">
          <strong>Objektstammdaten konnten nicht vollstaendig geladen werden.</strong>
          <p>{objectsResult.error ?? customersResult.error ?? addressesResult.error}</p>
        </section>
      ) : null}

      {canWrite ? (
        <section className="panel">
          <p className="eyebrow">Neues Objekt</p>
          <h2>Objekt anlegen</h2>
          <form action={createObjectAction} className="form-stack">
            <div className="form-grid">
              <label className="form-field full-span"><span>Name</span><input name="name" required /></label>
              <label className="form-field"><span>Typ</span><select defaultValue="OTHER" name="type">{objectTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label className="form-field"><span>Status</span><select defaultValue="ACTIVE" name="status"><option value="ACTIVE">Aktiv</option><option value="INACTIVE">Inaktiv</option></select></label>
              <label className="form-field"><span>Kunde</span><select defaultValue="" name="customerId"><option value="">Ohne Kundenzuordnung</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label>
              <label className="form-field"><span>Adresse</span><select defaultValue="" name="addressId"><option value="">Ohne Adresse</option>{addresses.map((address) => <option key={address.id} value={address.id}>{address.label} · {address.city}</option>)}</select></label>
              <label className="form-field full-span"><span>Notizen</span><textarea name="notes" rows={4} /></label>
            </div>
            <p className="muted-note">Wenn Kunde und Adresse gesetzt sind, verhindert die API widerspruechliche Kundenzuordnungen.</p>
            <div className="form-actions"><button className="primary-button" type="submit">Objekt anlegen</button></div>
          </form>
        </section>
      ) : (
        <section className="panel"><p>Ihre Rolle darf Objekte lesen, aber nicht bearbeiten.</p></section>
      )}

      <section className="panel">
        <p className="eyebrow">Objekte</p>
        <h2>{objects.length} Datensaetze</h2>
        <div className="table-shell">
          <table className="jobs-table">
            <thead><tr><th>Objekt</th><th>Kunde</th><th>Adresse</th><th>Bereiche</th><th>Status</th><th>Aktion</th></tr></thead>
            <tbody>
              {objects.map((object) => (
                <tr key={object.id}>
                  <td><Link href={`/objects/${object.id}`}>{object.name}</Link><span>{getObjectTypeLabel(object.type)}</span></td>
                  <td>{object.customer?.name ?? 'Ohne Kunde'}</td>
                  <td>{object.address ? formatAddress(object.address) : 'Ohne Adresse'}</td>
                  <td>{object.areaCount}</td>
                  <td>{getObjectStatusLabel(object.status)}</td>
                  <td><Link className="table-action" href={`/objects/${object.id}`}>Oeffnen</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {objects.length === 0 ? <p>Noch keine Objekte vorhanden.</p> : null}
      </section>
    </main>
  );
}
