import { BadRequestException } from '@nestjs/common';

import type {
  AddressCreateInput,
  AddressUpdateInput,
  CustomerCreateInput,
  CustomerType,
  CustomerUpdateInput,
  ObjectAreaCreateInput,
  ObjectAreaType,
  ObjectAreaUpdateInput,
  ObjectCreateInput,
  ObjectStatus,
  ObjectType,
  ObjectUpdateInput,
} from '@einsatzpilot/types';

function requiredText(value: unknown, field: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new BadRequestException(`${field} ist erforderlich.`);
  }

  return value.trim();
}

function optionalText(value: unknown) {
  if (value == null) {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new BadRequestException('Ungueltiger Textwert im Payload.');
  }

  return value.trim() || undefined;
}

function optionalNullableText(value: unknown) {
  if (value === null) {
    return null;
  }

  return optionalText(value);
}

function optionalBoolean(value: unknown, field: string) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'boolean') {
    throw new BadRequestException(`${field} muss ein boolescher Wert sein.`);
  }

  return value;
}

function customerType(value: unknown): CustomerType {
  if (
    value !== 'PRIVATE' &&
    value !== 'BUSINESS' &&
    value !== 'PROPERTY_MANAGEMENT' &&
    value !== 'OTHER'
  ) {
    throw new BadRequestException('type ist fuer den Kunden ungueltig.');
  }

  return value;
}

function objectType(value: unknown): ObjectType {
  if (
    value !== 'BUILDING' &&
    value !== 'GARDEN' &&
    value !== 'WAREHOUSE' &&
    value !== 'CONSTRUCTION_SITE' &&
    value !== 'OFFICE' &&
    value !== 'FACILITY' &&
    value !== 'OTHER'
  ) {
    throw new BadRequestException('type ist fuer das Objekt ungueltig.');
  }

  return value;
}

function objectStatus(value: unknown): ObjectStatus {
  if (value !== 'ACTIVE' && value !== 'INACTIVE') {
    throw new BadRequestException('status ist fuer das Objekt ungueltig.');
  }

  return value;
}

function objectAreaType(value: unknown): ObjectAreaType {
  if (
    value !== 'STAIRCASE' &&
    value !== 'BASEMENT' &&
    value !== 'ENTRANCE' &&
    value !== 'PARKING' &&
    value !== 'GARDEN_AREA' &&
    value !== 'ROOM' &&
    value !== 'STORAGE_AREA' &&
    value !== 'OTHER'
  ) {
    throw new BadRequestException('type ist fuer den Objektbereich ungueltig.');
  }

  return value;
}

export function normalizeCustomerCreateInput(input: CustomerCreateInput) {
  return {
    name: requiredText(input.name, 'name'),
    type: customerType(input.type),
    email: optionalText(input.email),
    phone: optionalText(input.phone),
    notes: optionalText(input.notes),
    isActive: optionalBoolean(input.isActive, 'isActive') ?? true,
  };
}

export function normalizeCustomerUpdateInput(input: CustomerUpdateInput) {
  return {
    name: input.name === undefined ? undefined : requiredText(input.name, 'name'),
    type: input.type === undefined ? undefined : customerType(input.type),
    email: input.email === undefined ? undefined : optionalNullableText(input.email),
    phone: input.phone === undefined ? undefined : optionalNullableText(input.phone),
    notes: input.notes === undefined ? undefined : optionalNullableText(input.notes),
    isActive: optionalBoolean(input.isActive, 'isActive'),
  };
}

export function normalizeAddressCreateInput(input: AddressCreateInput) {
  return {
    customerId: optionalText(input.customerId),
    label: requiredText(input.label, 'label'),
    street: requiredText(input.street, 'street'),
    postalCode: requiredText(input.postalCode, 'postalCode'),
    city: requiredText(input.city, 'city'),
    country: requiredText(input.country, 'country').toUpperCase(),
    notes: optionalText(input.notes),
  };
}

export function normalizeAddressUpdateInput(input: AddressUpdateInput) {
  return {
    customerId:
      input.customerId === undefined ? undefined : optionalNullableText(input.customerId),
    label: input.label === undefined ? undefined : requiredText(input.label, 'label'),
    street: input.street === undefined ? undefined : requiredText(input.street, 'street'),
    postalCode:
      input.postalCode === undefined
        ? undefined
        : requiredText(input.postalCode, 'postalCode'),
    city: input.city === undefined ? undefined : requiredText(input.city, 'city'),
    country:
      input.country === undefined
        ? undefined
        : requiredText(input.country, 'country').toUpperCase(),
    notes: input.notes === undefined ? undefined : optionalNullableText(input.notes),
  };
}

export function normalizeObjectCreateInput(input: ObjectCreateInput) {
  return {
    customerId: optionalText(input.customerId),
    addressId: optionalText(input.addressId),
    name: requiredText(input.name, 'name'),
    type: objectType(input.type),
    status: input.status === undefined ? 'ACTIVE' : objectStatus(input.status),
    notes: optionalText(input.notes),
  };
}

export function normalizeObjectUpdateInput(input: ObjectUpdateInput) {
  return {
    customerId:
      input.customerId === undefined ? undefined : optionalNullableText(input.customerId),
    addressId:
      input.addressId === undefined ? undefined : optionalNullableText(input.addressId),
    name: input.name === undefined ? undefined : requiredText(input.name, 'name'),
    type: input.type === undefined ? undefined : objectType(input.type),
    status: input.status === undefined ? undefined : objectStatus(input.status),
    notes: input.notes === undefined ? undefined : optionalNullableText(input.notes),
  };
}

export function normalizeObjectAreaCreateInput(input: ObjectAreaCreateInput) {
  return {
    name: requiredText(input.name, 'name'),
    type: objectAreaType(input.type),
    notes: optionalText(input.notes),
  };
}

export function normalizeObjectAreaUpdateInput(input: ObjectAreaUpdateInput) {
  return {
    name: input.name === undefined ? undefined : requiredText(input.name, 'name'),
    type: input.type === undefined ? undefined : objectAreaType(input.type),
    notes: input.notes === undefined ? undefined : optionalNullableText(input.notes),
  };
}
