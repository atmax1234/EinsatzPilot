import type {
  ServiceAgreementDetail,
  ServiceAgreementOptionsResponse,
} from '@einsatzpilot/types';

export function ServiceAgreementRelationFields({
  options,
  agreement,
}: {
  options: ServiceAgreementOptionsResponse;
  agreement?: ServiceAgreementDetail;
}) {
  return (
    <>
      <label className="form-field">
        <span>Kunde (optional)</span>
        <select defaultValue={agreement?.customerId ?? ''} name="customerId">
          <option value="">Kein Kunde</option>
          {options.customers.map((customer) => (
            <option key={customer.id} value={customer.id}>{customer.name}</option>
          ))}
        </select>
      </label>
      <label className="form-field">
        <span>Adresse (optional)</span>
        <select defaultValue={agreement?.addressId ?? ''} name="addressId">
          <option value="">Keine Adresse</option>
          {options.addresses.map((address) => (
            <option key={address.id} value={address.id}>
              {address.label} · {address.postalCode} {address.city}
            </option>
          ))}
        </select>
      </label>
      <label className="form-field">
        <span>Objekt (optional)</span>
        <select defaultValue={agreement?.objectId ?? ''} name="objectId">
          <option value="">Kein Objekt</option>
          {options.objects.map((object) => (
            <option key={object.id} value={object.id}>{object.name}</option>
          ))}
        </select>
      </label>
      <label className="form-field">
        <span>Objektbereich (optional)</span>
        <select defaultValue={agreement?.objectAreaId ?? ''} name="objectAreaId">
          <option value="">Kein Objektbereich</option>
          {options.objectAreas.map((area) => (
            <option key={area.id} value={area.id}>{area.name}</option>
          ))}
        </select>
        <small>Ein Bereich muss zum ausgewählten Objekt gehören.</small>
      </label>
    </>
  );
}
