import type { WorkdaySheetOptionsResponse, WorkdaySheetRowItem } from '@einsatzpilot/types';

export function WorkdaySheetRelationFields({
  options,
  row,
}: {
  options: WorkdaySheetOptionsResponse;
  row?: WorkdaySheetRowItem;
}) {
  return (
    <>
      <label className="form-field">
        <span>Kunde (optional)</span>
        <select defaultValue={row?.customerId ?? ''} name="customerId">
          <option value="">Kein Kunde</option>
          {options.customers.map((customer) => (
            <option key={customer.id} value={customer.id}>{customer.name}</option>
          ))}
        </select>
      </label>
      <label className="form-field">
        <span>Adresse (optional)</span>
        <select defaultValue={row?.addressId ?? ''} name="addressId">
          <option value="">Keine Adresse</option>
          {options.addresses.map((address) => (
            <option key={address.id} value={address.id}>
              {address.label} · {address.street}, {address.city}
            </option>
          ))}
        </select>
      </label>
      <label className="form-field">
        <span>Objekt (optional)</span>
        <select defaultValue={row?.objectId ?? ''} name="objectId">
          <option value="">Kein Objekt</option>
          {options.objects.map((object) => (
            <option key={object.id} value={object.id}>{object.name}</option>
          ))}
        </select>
      </label>
      <label className="form-field">
        <span>Objektbereich (optional)</span>
        <select defaultValue={row?.objectAreaId ?? ''} name="objectAreaId">
          <option value="">Kein Objektbereich</option>
          {options.objectAreas.map((area) => {
            const objectName = options.objects.find((object) => object.id === area.objectId)?.name;
            return (
              <option key={area.id} value={area.id}>
                {objectName ? `${objectName} · ` : ''}{area.name}
              </option>
            );
          })}
        </select>
      </label>
      <label className="form-field full-span">
        <span>Bestehender Auftrag (optional)</span>
        <select defaultValue={row?.jobId ?? ''} name="jobId">
          <option value="">Kein verknuepfter Auftrag</option>
          {options.jobs.map((job) => (
            <option key={job.id} value={job.id}>{job.reference} · {job.title}</option>
          ))}
        </select>
      </label>
    </>
  );
}
