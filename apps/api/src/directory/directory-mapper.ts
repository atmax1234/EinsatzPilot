import type {
  AddressListItem,
  CustomerListItem,
  ObjectAreaItem,
  ObjectDetailResponse,
  ObjectListItem,
} from '@einsatzpilot/types';

type CustomerRecord = {
  id: string;
  name: string;
  type: CustomerListItem['type'];
  email: string | null;
  phone: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    addresses: number;
    objects: number;
  };
};

type AddressRecord = {
  id: string;
  label: string;
  street: string;
  postalCode: string;
  city: string;
  country: string;
  notes: string | null;
  customer: { id: string; name: string } | null;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    objects: number;
  };
};

type ObjectAreaRecord = {
  id: string;
  objectId: string;
  name: string;
  type: ObjectAreaItem['type'];
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type ObjectRecord = {
  id: string;
  name: string;
  type: ObjectListItem['type'];
  status: ObjectListItem['status'];
  notes: string | null;
  customer: { id: string; name: string } | null;
  address: AddressRecord | null;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    areas: number;
  };
  areas?: ObjectAreaRecord[];
};

export function mapCustomerListItem(record: CustomerRecord): CustomerListItem {
  return {
    id: record.id,
    name: record.name,
    type: record.type,
    email: record.email ?? undefined,
    phone: record.phone ?? undefined,
    notes: record.notes ?? undefined,
    isActive: record.isActive,
    addressCount: record._count.addresses,
    objectCount: record._count.objects,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export function mapAddressListItem(record: AddressRecord): AddressListItem {
  return {
    id: record.id,
    label: record.label,
    street: record.street,
    postalCode: record.postalCode,
    city: record.city,
    country: record.country,
    notes: record.notes ?? undefined,
    customer: record.customer ?? undefined,
    objectCount: record._count.objects,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export function mapObjectAreaItem(record: ObjectAreaRecord): ObjectAreaItem {
  return {
    id: record.id,
    objectId: record.objectId,
    name: record.name,
    type: record.type,
    notes: record.notes ?? undefined,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export function mapObjectListItem(record: ObjectRecord): ObjectListItem {
  return {
    id: record.id,
    name: record.name,
    type: record.type,
    status: record.status,
    notes: record.notes ?? undefined,
    customer: record.customer ?? undefined,
    address: record.address ? mapAddressListItem(record.address) : undefined,
    areaCount: record._count.areas,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export function mapObjectDetailResponse(record: ObjectRecord): ObjectDetailResponse {
  return {
    object: {
      ...mapObjectListItem(record),
      areas: (record.areas ?? []).map(mapObjectAreaItem),
    },
  };
}
