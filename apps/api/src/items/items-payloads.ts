import { BadRequestException } from '@nestjs/common';

import type {
  ItemCategoryCreateInput,
  ItemCategoryUpdateInput,
  ItemCreateInput,
  ItemKind,
  ItemStatus,
  ItemTrackingMode,
  ItemUnit,
  ItemUpdateInput,
} from '@einsatzpilot/types';

const itemKinds: ItemKind[] = [
  'MATERIAL',
  'TOOL',
  'ASSET',
  'CONSUMABLE',
  'PACKAGE',
  'OTHER',
];
const itemUnits: ItemUnit[] = [
  'PIECE',
  'KG',
  'LITER',
  'METER',
  'SQUARE_METER',
  'CUBIC_METER',
  'PALLET',
  'BOX',
  'BAG',
  'OTHER',
];
const trackingModes: ItemTrackingMode[] = ['QUANTITY', 'SERIALIZED'];
const itemStatuses: ItemStatus[] = ['ACTIVE', 'INACTIVE', 'DAMAGED', 'LOST', 'ARCHIVED'];
const maxQuantity = 99_999_999_999.999;

function assertPayloadObject(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new BadRequestException('Payload muss ein JSON-Objekt sein.');
  }
}

function requiredText(value: unknown, field: string, maxLength: number) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new BadRequestException(`${field} ist erforderlich.`);
  }

  const normalized = value.trim();
  if (normalized.length > maxLength) {
    throw new BadRequestException(`${field} darf hoechstens ${maxLength} Zeichen enthalten.`);
  }

  return normalized;
}

function optionalText(value: unknown, field: string, maxLength: number) {
  if (value == null) {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new BadRequestException(`${field} muss Text sein.`);
  }

  const normalized = value.trim();
  if (normalized.length > maxLength) {
    throw new BadRequestException(`${field} darf hoechstens ${maxLength} Zeichen enthalten.`);
  }

  return normalized || undefined;
}

function optionalNullableText(value: unknown, field: string, maxLength: number) {
  if (value === null) {
    return null;
  }

  return optionalText(value, field, maxLength);
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

function enumValue<T extends string>(value: unknown, allowed: T[], field: string): T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    throw new BadRequestException(`${field} ist ungueltig.`);
  }

  return value as T;
}

function optionalCustomId(value: unknown) {
  const customId = optionalText(value, 'customId', 64)?.toUpperCase();

  if (customId && !/^[A-Z0-9][A-Z0-9._-]*$/.test(customId)) {
    throw new BadRequestException(
      'customId darf nur Buchstaben, Zahlen, Punkt, Unterstrich und Bindestrich enthalten.',
    );
  }

  return customId;
}

function requiredCustomId(value: unknown) {
  const customId = requiredText(value, 'customId', 64).toUpperCase();

  if (!/^[A-Z0-9][A-Z0-9._-]*$/.test(customId)) {
    throw new BadRequestException(
      'customId darf nur Buchstaben, Zahlen, Punkt, Unterstrich und Bindestrich enthalten.',
    );
  }

  return customId;
}

function optionalNullableId(value: unknown, field: string) {
  if (value === null) {
    return null;
  }

  return optionalText(value, field, 191);
}

function optionalQuantity(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new BadRequestException('quantity muss eine endliche Zahl sein.');
  }

  if (value < 0 || value > maxQuantity) {
    throw new BadRequestException(`quantity muss zwischen 0 und ${maxQuantity} liegen.`);
  }

  if (Math.abs(value * 1000 - Math.round(value * 1000)) > 1e-8) {
    throw new BadRequestException('quantity darf hoechstens drei Nachkommastellen haben.');
  }

  return value;
}

export function assertValidTrackingQuantity(
  trackingMode: ItemTrackingMode,
  quantity: number,
) {
  if (trackingMode === 'SERIALIZED' && quantity !== 1) {
    throw new BadRequestException('Serialisierte Artikel muessen quantity 1 haben.');
  }

  if (trackingMode === 'QUANTITY' && quantity < 0) {
    throw new BadRequestException('Mengenartikel duerfen keine negative quantity haben.');
  }
}

export function normalizeItemCategoryCreateInput(input: ItemCategoryCreateInput) {
  assertPayloadObject(input);
  return {
    name: requiredText(input.name, 'name', 120),
    description: optionalText(input.description, 'description', 4_000),
    kind: enumValue(input.kind, itemKinds, 'kind'),
    isActive: optionalBoolean(input.isActive, 'isActive') ?? true,
  };
}

export function normalizeItemCategoryUpdateInput(input: ItemCategoryUpdateInput) {
  assertPayloadObject(input);
  return {
    name: input.name === undefined ? undefined : requiredText(input.name, 'name', 120),
    description:
      input.description === undefined
        ? undefined
        : optionalNullableText(input.description, 'description', 4_000),
    kind: input.kind === undefined ? undefined : enumValue(input.kind, itemKinds, 'kind'),
    isActive: optionalBoolean(input.isActive, 'isActive'),
  };
}

export function normalizeItemCreateInput(input: ItemCreateInput) {
  assertPayloadObject(input);
  return {
    categoryId: optionalText(input.categoryId, 'categoryId', 191),
    customId: optionalCustomId(input.customId),
    name: requiredText(input.name, 'name', 200),
    description: optionalText(input.description, 'description', 4_000),
    kind: enumValue(input.kind, itemKinds, 'kind'),
    unit: enumValue(input.unit, itemUnits, 'unit'),
    trackingMode: enumValue(input.trackingMode, trackingModes, 'trackingMode'),
    quantity: optionalQuantity(input.quantity),
    status:
      input.status === undefined ? ('ACTIVE' as const) : enumValue(input.status, itemStatuses, 'status'),
    notes: optionalText(input.notes, 'notes', 4_000),
  };
}

export function normalizeItemUpdateInput(input: ItemUpdateInput) {
  assertPayloadObject(input);
  return {
    categoryId:
      input.categoryId === undefined
        ? undefined
        : optionalNullableId(input.categoryId, 'categoryId'),
    customId: input.customId === undefined ? undefined : requiredCustomId(input.customId),
    name: input.name === undefined ? undefined : requiredText(input.name, 'name', 200),
    description:
      input.description === undefined
        ? undefined
        : optionalNullableText(input.description, 'description', 4_000),
    kind: input.kind === undefined ? undefined : enumValue(input.kind, itemKinds, 'kind'),
    unit: input.unit === undefined ? undefined : enumValue(input.unit, itemUnits, 'unit'),
    trackingMode:
      input.trackingMode === undefined
        ? undefined
        : enumValue(input.trackingMode, trackingModes, 'trackingMode'),
    quantity: optionalQuantity(input.quantity),
    status:
      input.status === undefined ? undefined : enumValue(input.status, itemStatuses, 'status'),
    notes:
      input.notes === undefined ? undefined : optionalNullableText(input.notes, 'notes', 4_000),
  };
}
