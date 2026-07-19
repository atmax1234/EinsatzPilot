import type {
  AddressCreateInput,
  AddressListItem,
  AddressListResponse,
  AddressUpdateInput,
  CustomerCreateInput,
  CustomerListItem,
  CustomerListResponse,
  CustomerType,
  CustomerUpdateInput,
  ObjectAreaCreateInput,
  ObjectAreaItem,
  ObjectAreaType,
  ObjectAreaUpdateInput,
  ObjectCreateInput,
  ObjectDetailResponse,
  ObjectListItem,
  ObjectListResponse,
  ObjectStatus,
  ObjectType,
  ObjectUpdateInput,
} from '@einsatzpilot/types';

import { fetchApiJson } from './api';
import { getStoredSessionToken } from './server-auth';

async function getAuthTokenOrThrow() {
  const token = await getStoredSessionToken();

  if (!token) {
    throw new Error('Session-Token fehlt.');
  }

  return token;
}

export function getCustomerTypeLabel(type: CustomerType) {
  return {
    PRIVATE: 'Privatkunde',
    BUSINESS: 'Unternehmen',
    PROPERTY_MANAGEMENT: 'Hausverwaltung',
    OTHER: 'Sonstiger Kunde',
  }[type];
}

export function getObjectTypeLabel(type: ObjectType) {
  return {
    BUILDING: 'Gebaeude',
    GARDEN: 'Garten',
    WAREHOUSE: 'Lager',
    CONSTRUCTION_SITE: 'Baustelle',
    OFFICE: 'Buero',
    FACILITY: 'Betriebsstaette',
    OTHER: 'Sonstiges Objekt',
  }[type];
}

export function getObjectStatusLabel(status: ObjectStatus) {
  return status === 'ACTIVE' ? 'Aktiv' : 'Inaktiv';
}

export function getObjectAreaTypeLabel(type: ObjectAreaType) {
  return {
    STAIRCASE: 'Treppenhaus',
    BASEMENT: 'Keller',
    ENTRANCE: 'Eingang',
    PARKING: 'Parkplatz',
    GARDEN_AREA: 'Gartenbereich',
    ROOM: 'Raum',
    STORAGE_AREA: 'Lagerbereich',
    OTHER: 'Sonstiger Bereich',
  }[type];
}

export function formatAddress(address: Pick<AddressListItem, 'street' | 'postalCode' | 'city' | 'country'>) {
  return `${address.street}, ${address.postalCode} ${address.city}, ${address.country}`;
}

export async function getCustomersData() {
  const token = await getAuthTokenOrThrow();
  return fetchApiJson<CustomerListResponse>('/api/customers', { authToken: token });
}

export async function createCustomerData(input: CustomerCreateInput) {
  const token = await getAuthTokenOrThrow();
  return fetchApiJson<CustomerListItem>('/api/customers', {
    authToken: token,
    method: 'POST',
    json: input,
  });
}

export async function updateCustomerData(customerId: string, input: CustomerUpdateInput) {
  const token = await getAuthTokenOrThrow();
  return fetchApiJson<CustomerListItem>(`/api/customers/${customerId}`, {
    authToken: token,
    method: 'PATCH',
    json: input,
  });
}

export async function getAddressesData() {
  const token = await getAuthTokenOrThrow();
  return fetchApiJson<AddressListResponse>('/api/addresses', { authToken: token });
}

export async function createAddressData(input: AddressCreateInput) {
  const token = await getAuthTokenOrThrow();
  return fetchApiJson<AddressListItem>('/api/addresses', {
    authToken: token,
    method: 'POST',
    json: input,
  });
}

export async function updateAddressData(addressId: string, input: AddressUpdateInput) {
  const token = await getAuthTokenOrThrow();
  return fetchApiJson<AddressListItem>(`/api/addresses/${addressId}`, {
    authToken: token,
    method: 'PATCH',
    json: input,
  });
}

export async function getObjectsData() {
  const token = await getAuthTokenOrThrow();
  return fetchApiJson<ObjectListResponse>('/api/objects', { authToken: token });
}

export async function getObjectDetailData(objectId: string) {
  const token = await getAuthTokenOrThrow();
  return fetchApiJson<ObjectDetailResponse>(`/api/objects/${objectId}`, { authToken: token });
}

export async function createObjectData(input: ObjectCreateInput) {
  const token = await getAuthTokenOrThrow();
  return fetchApiJson<ObjectListItem>('/api/objects', {
    authToken: token,
    method: 'POST',
    json: input,
  });
}

export async function updateObjectData(objectId: string, input: ObjectUpdateInput) {
  const token = await getAuthTokenOrThrow();
  return fetchApiJson<ObjectListItem>(`/api/objects/${objectId}`, {
    authToken: token,
    method: 'PATCH',
    json: input,
  });
}

export async function createObjectAreaData(objectId: string, input: ObjectAreaCreateInput) {
  const token = await getAuthTokenOrThrow();
  return fetchApiJson<ObjectAreaItem>(`/api/objects/${objectId}/areas`, {
    authToken: token,
    method: 'POST',
    json: input,
  });
}

export async function updateObjectAreaData(
  objectId: string,
  areaId: string,
  input: ObjectAreaUpdateInput,
) {
  const token = await getAuthTokenOrThrow();
  return fetchApiJson<ObjectAreaItem>(`/api/objects/${objectId}/areas/${areaId}`, {
    authToken: token,
    method: 'PATCH',
    json: input,
  });
}
