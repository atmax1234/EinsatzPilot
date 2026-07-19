import {
  createAddressAction,
  createCustomerAction,
  updateAddressAction,
  updateCustomerAction,
} from '../../../lib/directory-actions';
import {
  formatAddress,
  getAddressesData,
  getCustomersData,
  getCustomerTypeLabel,
} from '../../../lib/directory';
import { requireServerSession } from '../../../lib/server-auth';

const noticeLabels: Record<string, string> = {
  'customer-created': 'Der Kunde wurde angelegt.',
  'customer-updated': 'Der Kunde wurde aktualisiert.',
  'address-created': 'Die Adresse wurde angelegt.',
  'address-updated': 'Die Adresse wurde aktualisiert.',
};

const customerTypes = [
  ['PRIVATE', 'Privatkunde'],
  ['BUSINESS', 'Unternehmen'],
  ['PROPERTY_MANAGEMENT', 'Hausverwaltung'],
  ['OTHER', 'Sonstiger Kunde'],
] as const;

export default async function CustomersPage({
  searchParams,
}: {
  searchParams?: Promise<{ notice?: string; error?: string }>;
}) {
  const [session, customersResult, addressesResult, params] = await Promise.all([
    requireServerSession(),
    getCustomersData(),
    getAddressesData(),
    searchParams,
  ]);
  const customers = customersResult.data?.customers ?? [];
  const addresses = addressesResult.data?.addresses ?? [];
  const canWrite = session.membershipRole === 'OWNER' || session.membershipRole === 'OFFICE';
  const flash = params?.error
    ? { tone: 'error', text: params.error }
    : params?.notice && noticeLabels[params.notice]
      ? { tone: 'success', text: noticeLabels[params.notice] }
      : null;

  return (
    <main className="content-page">
      <section className="hero-card">
        <p className="eyebrow">Stammdaten</p>
        <h1>Kunden und Adressen</h1>
        <p>
          Kunden und wiederverwendbare Adressen sind jetzt eigene, tenant-sichere
          Datensaetze. Bestehende Auftraege bleiben vorerst bei ihren Textfeldern.
        </p>
      </section>

      {flash ? (
        <section className={`panel flash-banner ${flash.tone}`}>
          <strong>{flash.tone === 'error' ? 'Aktion fehlgeschlagen' : 'Aktion gespeichert'}</strong>
          <p>{flash.text}</p>
        </section>
      ) : null}

      {!customersResult.ok || !addressesResult.ok ? (
        <section className="panel flash-banner error">
          <strong>Stammdaten konnten nicht vollstaendig geladen werden.</strong>
          <p>{customersResult.error ?? addressesResult.error}</p>
        </section>
      ) : null}

      {canWrite ? (
        <section className="content-grid">
          <article className="panel">
            <p className="eyebrow">Neuer Kunde</p>
            <h2>Kundenstamm erweitern</h2>
            <form action={createCustomerAction} className="form-stack">
              <div className="form-grid">
                <label className="form-field full-span">
                  <span>Name</span>
                  <input name="name" required />
                </label>
                <label className="form-field">
                  <span>Typ</span>
                  <select defaultValue="BUSINESS" name="type">
                    {customerTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
                <label className="form-field">
                  <span>E-Mail</span>
                  <input name="email" type="email" />
                </label>
                <label className="form-field">
                  <span>Telefon</span>
                  <input name="phone" />
                </label>
                <label className="form-field full-span">
                  <span>Notizen</span>
                  <textarea name="notes" rows={3} />
                </label>
              </div>
              <div className="form-actions"><button className="primary-button" type="submit">Kunde anlegen</button></div>
            </form>
          </article>

          <article className="panel">
            <p className="eyebrow">Neue Adresse</p>
            <h2>Standort erfassen</h2>
            <form action={createAddressAction} className="form-stack">
              <div className="form-grid">
                <label className="form-field">
                  <span>Kunde</span>
                  <select defaultValue="" name="customerId">
                    <option value="">Ohne Kundenzuordnung</option>
                    {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
                  </select>
                </label>
                <label className="form-field">
                  <span>Label</span>
                  <input name="label" placeholder="Hauptadresse" required />
                </label>
                <label className="form-field full-span">
                  <span>Strasse und Hausnummer</span>
                  <input name="street" required />
                </label>
                <label className="form-field"><span>PLZ</span><input name="postalCode" required /></label>
                <label className="form-field"><span>Ort</span><input name="city" required /></label>
                <label className="form-field"><span>Land</span><input defaultValue="DE" name="country" required /></label>
                <label className="form-field full-span"><span>Notizen</span><textarea name="notes" rows={3} /></label>
              </div>
              <div className="form-actions"><button className="primary-button" type="submit">Adresse anlegen</button></div>
            </form>
          </article>
        </section>
      ) : (
        <section className="panel"><p>Ihre Rolle darf Kunden und Adressen lesen, aber nicht bearbeiten.</p></section>
      )}

      <section className="panel">
        <p className="eyebrow">Kunden</p>
        <h2>{customers.length} Datensaetze</h2>
        <div className="team-grid">
          {customers.map((customer) => (
            <article className="team-card" key={customer.id}>
              <div className="row-spread">
                <div><strong>{customer.name}</strong><p className="compact-text">{getCustomerTypeLabel(customer.type)}</p></div>
                <span className="inline-chip">{customer.isActive ? 'Aktiv' : 'Inaktiv'}</span>
              </div>
              <p className="compact-text">{customer.addressCount} Adressen · {customer.objectCount} Objekte</p>
              {canWrite ? (
                <form action={updateCustomerAction.bind(null, customer.id)} className="form-stack nested-stack">
                  <div className="form-grid">
                    <label className="form-field full-span"><span>Name</span><input defaultValue={customer.name} name="name" required /></label>
                    <label className="form-field"><span>Typ</span><select defaultValue={customer.type} name="type">{customerTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                    <label className="form-field"><span>Status</span><select defaultValue={String(customer.isActive)} name="isActive"><option value="true">Aktiv</option><option value="false">Inaktiv</option></select></label>
                    <label className="form-field"><span>E-Mail</span><input defaultValue={customer.email ?? ''} name="email" type="email" /></label>
                    <label className="form-field"><span>Telefon</span><input defaultValue={customer.phone ?? ''} name="phone" /></label>
                    <label className="form-field full-span"><span>Notizen</span><textarea defaultValue={customer.notes ?? ''} name="notes" rows={3} /></label>
                  </div>
                  <div className="form-actions"><button className="secondary-button" type="submit">Kunde speichern</button></div>
                </form>
              ) : null}
            </article>
          ))}
          {customers.length === 0 ? <p>Noch keine Kunden vorhanden.</p> : null}
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">Adressen</p>
        <h2>{addresses.length} wiederverwendbare Standorte</h2>
        <div className="team-grid">
          {addresses.map((address) => (
            <article className="team-card" key={address.id}>
              <strong>{address.label}</strong>
              <p className="compact-text">{formatAddress(address)}</p>
              <p className="compact-text">{address.customer?.name ?? 'Ohne Kunde'} · {address.objectCount} Objekte</p>
              {canWrite ? (
                <form action={updateAddressAction.bind(null, address.id)} className="form-stack nested-stack">
                  <div className="form-grid">
                    <label className="form-field"><span>Kunde</span><select defaultValue={address.customer?.id ?? ''} name="customerId"><option value="">Ohne Kunde</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label>
                    <label className="form-field"><span>Label</span><input defaultValue={address.label} name="label" required /></label>
                    <label className="form-field full-span"><span>Strasse</span><input defaultValue={address.street} name="street" required /></label>
                    <label className="form-field"><span>PLZ</span><input defaultValue={address.postalCode} name="postalCode" required /></label>
                    <label className="form-field"><span>Ort</span><input defaultValue={address.city} name="city" required /></label>
                    <label className="form-field"><span>Land</span><input defaultValue={address.country} name="country" required /></label>
                    <label className="form-field full-span"><span>Notizen</span><textarea defaultValue={address.notes ?? ''} name="notes" rows={3} /></label>
                  </div>
                  <div className="form-actions"><button className="secondary-button" type="submit">Adresse speichern</button></div>
                </form>
              ) : null}
            </article>
          ))}
          {addresses.length === 0 ? <p>Noch keine Adressen vorhanden.</p> : null}
        </div>
      </section>
    </main>
  );
}
