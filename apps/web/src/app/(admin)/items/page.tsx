import {
  createItemAction,
  createItemCategoryAction,
  updateItemAction,
  updateItemCategoryAction,
} from '../../../lib/item-actions';
import {
  getItemCategoriesData,
  getItemKindLabel,
  getItemsData,
  getItemStatusLabel,
  getItemTrackingModeLabel,
  getItemUnitLabel,
} from '../../../lib/items';
import { requireServerSession } from '../../../lib/server-auth';

const noticeLabels: Record<string, string> = {
  'category-created': 'Die Kategorie wurde angelegt.',
  'category-updated': 'Die Kategorie wurde aktualisiert.',
  'item-created': 'Der Artikel wurde angelegt.',
  'item-updated': 'Der Artikel wurde aktualisiert.',
};

const itemKinds = [
  ['MATERIAL', 'Material'],
  ['TOOL', 'Werkzeug'],
  ['ASSET', 'Anlagegut'],
  ['CONSUMABLE', 'Verbrauchsmaterial'],
  ['PACKAGE', 'Paket'],
  ['OTHER', 'Sonstiges'],
] as const;

const itemUnits = [
  ['PIECE', 'Stueck'],
  ['KG', 'kg'],
  ['LITER', 'Liter'],
  ['METER', 'Meter'],
  ['SQUARE_METER', 'Quadratmeter'],
  ['CUBIC_METER', 'Kubikmeter'],
  ['PALLET', 'Palette'],
  ['BOX', 'Karton'],
  ['BAG', 'Sack'],
  ['OTHER', 'Andere Einheit'],
] as const;

const itemStatuses = [
  ['ACTIVE', 'Aktiv'],
  ['INACTIVE', 'Inaktiv'],
  ['DAMAGED', 'Beschaedigt'],
  ['LOST', 'Verloren'],
  ['ARCHIVED', 'Archiviert'],
] as const;

export default async function ItemsPage({
  searchParams,
}: {
  searchParams?: Promise<{ notice?: string; error?: string }>;
}) {
  const [session, categoriesResult, itemsResult, params] = await Promise.all([
    requireServerSession(),
    getItemCategoriesData(),
    getItemsData(),
    searchParams,
  ]);
  const categories = categoriesResult.data?.categories ?? [];
  const items = itemsResult.data?.items ?? [];
  const canWrite = session.membershipRole === 'OWNER' || session.membershipRole === 'OFFICE';
  const flash = params?.error
    ? { tone: 'error', text: params.error }
    : params?.notice && noticeLabels[params.notice]
      ? { tone: 'success', text: noticeLabels[params.notice] }
      : null;

  return (
    <main className="content-page">
      <section className="hero-card">
        <p className="eyebrow">Artikelstamm</p>
        <h1>Kategorien und Artikel</h1>
        <p>
          Firmenbezogene Kategorien und Artikel bilden stabile Stammdaten. Mengenbewegungen,
          Zuweisungen und Lagerorte sind in dieser Phase nicht enthalten.
        </p>
      </section>

      {flash ? (
        <section className={`panel flash-banner ${flash.tone === 'error' ? 'error' : 'success'}`}>
          <strong>{flash.tone === 'error' ? 'Aktion fehlgeschlagen' : 'Aktion gespeichert'}</strong>
          <p>{flash.text}</p>
        </section>
      ) : null}

      {!categoriesResult.ok || !itemsResult.ok ? (
        <section className="panel flash-banner error">
          <strong>Artikelstammdaten konnten nicht vollstaendig geladen werden.</strong>
          <p>{categoriesResult.error ?? itemsResult.error}</p>
        </section>
      ) : null}

      {canWrite ? (
        <section className="content-grid">
          <article className="panel">
            <p className="eyebrow">Neue Kategorie</p>
            <h2>Kategorie anlegen</h2>
            <form action={createItemCategoryAction} className="form-stack">
              <div className="form-grid">
                <label className="form-field full-span">
                  <span>Name</span>
                  <input name="name" required />
                </label>
                <label className="form-field">
                  <span>Art</span>
                  <select defaultValue="OTHER" name="kind">
                    {itemKinds.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
                <label className="form-field full-span">
                  <span>Beschreibung</span>
                  <textarea name="description" rows={3} />
                </label>
              </div>
              <div className="form-actions">
                <button className="primary-button" type="submit">Kategorie anlegen</button>
              </div>
            </form>
          </article>

          <article className="panel">
            <p className="eyebrow">Neuer Artikel</p>
            <h2>Artikel anlegen</h2>
            <form action={createItemAction} className="form-stack">
              <div className="form-grid">
                <label className="form-field full-span"><span>Name</span><input name="name" required /></label>
                <label className="form-field"><span>Eigene ID</span><input name="customId" placeholder="Wird automatisch erzeugt" /></label>
                <label className="form-field"><span>Kategorie</span><select defaultValue="" name="categoryId"><option value="">Ohne Kategorie</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
                <label className="form-field"><span>Art</span><select defaultValue="OTHER" name="kind">{itemKinds.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                <label className="form-field"><span>Einheit</span><select defaultValue="PIECE" name="unit">{itemUnits.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                <label className="form-field"><span>Tracking</span><select defaultValue="QUANTITY" name="trackingMode"><option value="QUANTITY">Mengenartikel</option><option value="SERIALIZED">Serialisiert</option></select></label>
                <label className="form-field"><span>Menge</span><input defaultValue="1" min="0" name="quantity" required step="0.001" type="number" /></label>
                <label className="form-field"><span>Status</span><select defaultValue="ACTIVE" name="status">{itemStatuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                <label className="form-field full-span"><span>Beschreibung</span><textarea name="description" rows={2} /></label>
                <label className="form-field full-span"><span>Notizen</span><textarea name="notes" rows={2} /></label>
              </div>
              <p className="muted-note">Serialisierte Artikel muessen die Menge 1 haben.</p>
              <div className="form-actions"><button className="primary-button" type="submit">Artikel anlegen</button></div>
            </form>
          </article>
        </section>
      ) : (
        <section className="panel"><p>Ihre Rolle darf Kategorien und Artikel lesen, aber nicht bearbeiten.</p></section>
      )}

      <section className="panel">
        <p className="eyebrow">Kategorien</p>
        <h2>{categories.length} Datensaetze</h2>
        <div className="team-grid">
          {categories.map((category) => (
            <article className="team-card" key={category.id}>
              <div className="row-spread">
                <div><strong>{category.name}</strong><p className="compact-text">{getItemKindLabel(category.kind)} · {category.itemCount} Artikel</p></div>
                <span className="inline-chip">{category.isActive ? 'Aktiv' : 'Inaktiv'}</span>
              </div>
              {category.description ? <p className="compact-text">{category.description}</p> : null}
              {canWrite ? (
                <form action={updateItemCategoryAction.bind(null, category.id)} className="form-stack nested-stack">
                  <div className="form-grid">
                    <label className="form-field full-span"><span>Name</span><input defaultValue={category.name} name="name" required /></label>
                    <label className="form-field"><span>Art</span><select defaultValue={category.kind} name="kind">{itemKinds.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                    <label className="form-field"><span>Status</span><select defaultValue={String(category.isActive)} name="isActive"><option value="true">Aktiv</option><option value="false">Inaktiv</option></select></label>
                    <label className="form-field full-span"><span>Beschreibung</span><textarea defaultValue={category.description ?? ''} name="description" rows={2} /></label>
                  </div>
                  <div className="form-actions"><button className="secondary-button" type="submit">Kategorie speichern</button></div>
                </form>
              ) : null}
            </article>
          ))}
          {categories.length === 0 ? <p>Noch keine Kategorien vorhanden.</p> : null}
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">Artikel</p>
        <h2>{items.length} Datensaetze</h2>
        <div className="team-grid">
          {items.map((item) => (
            <article className="team-card" key={item.id}>
              <div className="row-spread">
                <div><strong>{item.name}</strong><p className="compact-text">{item.customId} · {getItemKindLabel(item.kind)}</p></div>
                <span className="inline-chip">{getItemStatusLabel(item.status)}</span>
              </div>
              <p className="compact-text">{item.category?.name ?? 'Ohne Kategorie'} · {getItemTrackingModeLabel(item.trackingMode)} · {item.quantity} {getItemUnitLabel(item.unit)}</p>
              {canWrite ? (
                <form action={updateItemAction.bind(null, item.id)} className="form-stack nested-stack">
                  <div className="form-grid">
                    <label className="form-field full-span"><span>Name</span><input defaultValue={item.name} name="name" required /></label>
                    <label className="form-field"><span>Eigene ID</span><input defaultValue={item.customId} name="customId" required /></label>
                    <label className="form-field"><span>Kategorie</span><select defaultValue={item.category?.id ?? ''} name="categoryId"><option value="">Ohne Kategorie</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
                    <label className="form-field"><span>Art</span><select defaultValue={item.kind} name="kind">{itemKinds.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                    <label className="form-field"><span>Einheit</span><select defaultValue={item.unit} name="unit">{itemUnits.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                    <label className="form-field"><span>Tracking</span><select defaultValue={item.trackingMode} name="trackingMode"><option value="QUANTITY">Mengenartikel</option><option value="SERIALIZED">Serialisiert</option></select></label>
                    <label className="form-field"><span>Menge</span><input defaultValue={item.quantity} min="0" name="quantity" required step="0.001" type="number" /></label>
                    <label className="form-field"><span>Status</span><select defaultValue={item.status} name="status">{itemStatuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                    <label className="form-field full-span"><span>Beschreibung</span><textarea defaultValue={item.description ?? ''} name="description" rows={2} /></label>
                    <label className="form-field full-span"><span>Notizen</span><textarea defaultValue={item.notes ?? ''} name="notes" rows={2} /></label>
                  </div>
                  <p className="muted-note">Serialisierte Artikel muessen die Menge 1 haben.</p>
                  <div className="form-actions"><button className="secondary-button" type="submit">Artikel speichern</button></div>
                </form>
              ) : null}
            </article>
          ))}
          {items.length === 0 ? <p>Noch keine Artikel vorhanden.</p> : null}
        </div>
      </section>
    </main>
  );
}
