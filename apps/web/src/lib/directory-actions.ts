'use server';

import type {
  CustomerType,
  ObjectAreaType,
  ObjectStatus,
  ObjectType,
} from '@einsatzpilot/types';
import { redirect } from 'next/navigation';

import {
  createAddressData,
  createCustomerData,
  createObjectAreaData,
  createObjectData,
  updateAddressData,
  updateCustomerData,
  updateObjectAreaData,
  updateObjectData,
} from './directory';

function requiredString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${key} ist erforderlich.`);
  }

  return value.trim();
}

function optionalString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function optionalNullableString(formData: FormData, key: string) {
  return optionalString(formData, key) ?? null;
}

function redirectWith(path: string, values: Record<string, string | undefined>): never {
  const params = new URLSearchParams();

  Object.entries(values).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  redirect(params.size ? `${path}?${params.toString()}` : path);
}

function customerType(formData: FormData): CustomerType {
  const value = requiredString(formData, 'type');
  if (value === 'PRIVATE' || value === 'BUSINESS' || value === 'PROPERTY_MANAGEMENT' || value === 'OTHER') {
    return value;
  }
  throw new Error('Kundentyp ist ungueltig.');
}

function objectType(formData: FormData): ObjectType {
  const value = requiredString(formData, 'type');
  if (value === 'BUILDING' || value === 'GARDEN' || value === 'WAREHOUSE' || value === 'CONSTRUCTION_SITE' || value === 'OFFICE' || value === 'FACILITY' || value === 'OTHER') {
    return value;
  }
  throw new Error('Objekttyp ist ungueltig.');
}

function objectStatus(formData: FormData): ObjectStatus {
  const value = requiredString(formData, 'status');
  if (value === 'ACTIVE' || value === 'INACTIVE') {
    return value;
  }
  throw new Error('Objektstatus ist ungueltig.');
}

function objectAreaType(formData: FormData): ObjectAreaType {
  const value = requiredString(formData, 'type');
  if (value === 'STAIRCASE' || value === 'BASEMENT' || value === 'ENTRANCE' || value === 'PARKING' || value === 'GARDEN_AREA' || value === 'ROOM' || value === 'STORAGE_AREA' || value === 'OTHER') {
    return value;
  }
  throw new Error('Bereichstyp ist ungueltig.');
}

export async function createCustomerAction(formData: FormData) {
  try {
    const result = await createCustomerData({
      name: requiredString(formData, 'name'),
      type: customerType(formData),
      email: optionalString(formData, 'email'),
      phone: optionalString(formData, 'phone'),
      notes: optionalString(formData, 'notes'),
      isActive: true,
    });
    redirectWith('/customers', result.ok ? { notice: 'customer-created' } : { error: result.error });
  } catch (error) {
    redirectWith('/customers', { error: error instanceof Error ? error.message : 'Kunde konnte nicht erstellt werden.' });
  }
}

export async function updateCustomerAction(customerId: string, formData: FormData) {
  try {
    const result = await updateCustomerData(customerId, {
      name: requiredString(formData, 'name'),
      type: customerType(formData),
      email: optionalNullableString(formData, 'email'),
      phone: optionalNullableString(formData, 'phone'),
      notes: optionalNullableString(formData, 'notes'),
      isActive: requiredString(formData, 'isActive') === 'true',
    });
    redirectWith('/customers', result.ok ? { notice: 'customer-updated' } : { error: result.error });
  } catch (error) {
    redirectWith('/customers', { error: error instanceof Error ? error.message : 'Kunde konnte nicht aktualisiert werden.' });
  }
}

export async function createAddressAction(formData: FormData) {
  try {
    const result = await createAddressData({
      customerId: optionalString(formData, 'customerId'),
      label: requiredString(formData, 'label'),
      street: requiredString(formData, 'street'),
      postalCode: requiredString(formData, 'postalCode'),
      city: requiredString(formData, 'city'),
      country: requiredString(formData, 'country'),
      notes: optionalString(formData, 'notes'),
    });
    redirectWith('/customers', result.ok ? { notice: 'address-created' } : { error: result.error });
  } catch (error) {
    redirectWith('/customers', { error: error instanceof Error ? error.message : 'Adresse konnte nicht erstellt werden.' });
  }
}

export async function updateAddressAction(addressId: string, formData: FormData) {
  try {
    const result = await updateAddressData(addressId, {
      customerId: optionalNullableString(formData, 'customerId'),
      label: requiredString(formData, 'label'),
      street: requiredString(formData, 'street'),
      postalCode: requiredString(formData, 'postalCode'),
      city: requiredString(formData, 'city'),
      country: requiredString(formData, 'country'),
      notes: optionalNullableString(formData, 'notes'),
    });
    redirectWith('/customers', result.ok ? { notice: 'address-updated' } : { error: result.error });
  } catch (error) {
    redirectWith('/customers', { error: error instanceof Error ? error.message : 'Adresse konnte nicht aktualisiert werden.' });
  }
}

export async function createObjectAction(formData: FormData) {
  try {
    const result = await createObjectData({
      customerId: optionalString(formData, 'customerId'),
      addressId: optionalString(formData, 'addressId'),
      name: requiredString(formData, 'name'),
      type: objectType(formData),
      status: objectStatus(formData),
      notes: optionalString(formData, 'notes'),
    });
    if (result.ok && result.data) {
      redirectWith(`/objects/${result.data.id}`, { notice: 'object-created' });
    }
    redirectWith('/objects', { error: result.error ?? 'Objekt konnte nicht erstellt werden.' });
  } catch (error) {
    redirectWith('/objects', { error: error instanceof Error ? error.message : 'Objekt konnte nicht erstellt werden.' });
  }
}

export async function updateObjectAction(objectId: string, formData: FormData) {
  try {
    const result = await updateObjectData(objectId, {
      customerId: optionalNullableString(formData, 'customerId'),
      addressId: optionalNullableString(formData, 'addressId'),
      name: requiredString(formData, 'name'),
      type: objectType(formData),
      status: objectStatus(formData),
      notes: optionalNullableString(formData, 'notes'),
    });
    redirectWith(`/objects/${objectId}`, result.ok ? { notice: 'object-updated' } : { error: result.error });
  } catch (error) {
    redirectWith(`/objects/${objectId}`, { error: error instanceof Error ? error.message : 'Objekt konnte nicht aktualisiert werden.' });
  }
}

export async function createObjectAreaAction(objectId: string, formData: FormData) {
  try {
    const result = await createObjectAreaData(objectId, {
      name: requiredString(formData, 'name'),
      type: objectAreaType(formData),
      notes: optionalString(formData, 'notes'),
    });
    redirectWith(`/objects/${objectId}`, result.ok ? { notice: 'area-created' } : { error: result.error });
  } catch (error) {
    redirectWith(`/objects/${objectId}`, { error: error instanceof Error ? error.message : 'Bereich konnte nicht erstellt werden.' });
  }
}

export async function updateObjectAreaAction(objectId: string, areaId: string, formData: FormData) {
  try {
    const result = await updateObjectAreaData(objectId, areaId, {
      name: requiredString(formData, 'name'),
      type: objectAreaType(formData),
      notes: optionalNullableString(formData, 'notes'),
    });
    redirectWith(`/objects/${objectId}`, result.ok ? { notice: 'area-updated' } : { error: result.error });
  } catch (error) {
    redirectWith(`/objects/${objectId}`, { error: error instanceof Error ? error.message : 'Bereich konnte nicht aktualisiert werden.' });
  }
}
