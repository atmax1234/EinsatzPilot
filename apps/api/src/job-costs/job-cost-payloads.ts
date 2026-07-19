import { BadRequestException } from '@nestjs/common';

import { jobCostKinds, jobCostUnits } from '@einsatzpilot/schemas';
import type {
  JobCostCreateInput,
  JobCostKind,
  JobCostUnit,
  JobCostUpdateInput,
} from '@einsatzpilot/types';

const maxQuantity = 99_999_999_999.999;
const maxMoney = 999_999_999_999.99;

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
  if (value === undefined) {
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

function enumValue<T extends string>(value: unknown, allowed: readonly T[], field: string): T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    throw new BadRequestException(`${field} ist ungueltig.`);
  }

  return value as T;
}

function decimalNumber(input: {
  value: unknown;
  field: string;
  max: number;
  decimalPlaces: number;
  positive: boolean;
}) {
  if (typeof input.value !== 'number' || !Number.isFinite(input.value)) {
    throw new BadRequestException(`${input.field} muss eine endliche Zahl sein.`);
  }

  const minimum = input.positive ? Number.EPSILON : 0;
  if (input.value < minimum || input.value > input.max) {
    const qualifier = input.positive ? 'groesser als 0 und' : 'zwischen 0 und';
    throw new BadRequestException(
      `${input.field} muss ${qualifier} hoechstens ${input.max} sein.`,
    );
  }

  const factor = 10 ** input.decimalPlaces;
  if (Math.abs(input.value * factor - Math.round(input.value * factor)) > 1e-6) {
    throw new BadRequestException(
      `${input.field} darf hoechstens ${input.decimalPlaces} Nachkommastellen haben.`,
    );
  }

  return input.value;
}

function quantity(value: unknown) {
  return decimalNumber({
    value,
    field: 'quantity',
    max: maxQuantity,
    decimalPlaces: 3,
    positive: true,
  });
}

function money(value: unknown, field: string) {
  return decimalNumber({
    value,
    field,
    max: maxMoney,
    decimalPlaces: 2,
    positive: false,
  });
}

function optionalMoney(value: unknown, field: string) {
  return value === undefined ? undefined : money(value, field);
}

function optionalNullableMoney(value: unknown, field: string) {
  return value === null ? null : optionalMoney(value, field);
}

function optionalTaxRate(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  return decimalNumber({
    value,
    field: 'taxRate',
    max: 100,
    decimalPlaces: 2,
    positive: false,
  });
}

function optionalNullableTaxRate(value: unknown) {
  return value === null ? null : optionalTaxRate(value);
}

function currency(value: unknown) {
  if (value === undefined) {
    return 'EUR';
  }

  if (typeof value !== 'string' || !/^[A-Za-z]{3}$/.test(value.trim())) {
    throw new BadRequestException('currency muss ein dreistelliger Waehrungscode sein.');
  }

  return value.trim().toUpperCase();
}

function optionalCurrency(value: unknown) {
  return value === undefined ? undefined : currency(value);
}

function optionalDate(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string' || !value.trim()) {
    throw new BadRequestException('costDate muss ein gueltiges Datum sein.');
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException('costDate muss ein gueltiges Datum sein.');
  }

  return date;
}

function optionalId(value: unknown) {
  return optionalText(value, 'itemId', 191);
}

function optionalNullableId(value: unknown) {
  if (value === null) {
    return null;
  }

  return optionalId(value);
}

export function normalizeJobCostCreateInput(input: JobCostCreateInput) {
  assertPayloadObject(input);
  return {
    itemId: optionalId(input.itemId),
    kind: enumValue<JobCostKind>(input.kind, jobCostKinds, 'kind'),
    description: requiredText(input.description, 'description', 240),
    quantity: quantity(input.quantity),
    unit: enumValue<JobCostUnit>(input.unit, jobCostUnits, 'unit'),
    unitCost: optionalMoney(input.unitCost, 'unitCost'),
    totalCost: optionalMoney(input.totalCost, 'totalCost'),
    currency: currency(input.currency),
    taxRate: optionalTaxRate(input.taxRate),
    costDate: optionalDate(input.costDate),
    vendorName: optionalText(input.vendorName, 'vendorName', 200),
    receiptReference: optionalText(input.receiptReference, 'receiptReference', 120),
    notes: optionalText(input.notes, 'notes', 4_000),
  };
}

export function normalizeJobCostUpdateInput(input: JobCostUpdateInput) {
  assertPayloadObject(input);
  const payload = {
    itemId: optionalNullableId(input.itemId),
    kind:
      input.kind === undefined
        ? undefined
        : enumValue<JobCostKind>(input.kind, jobCostKinds, 'kind'),
    description:
      input.description === undefined
        ? undefined
        : requiredText(input.description, 'description', 240),
    quantity: input.quantity === undefined ? undefined : quantity(input.quantity),
    unit:
      input.unit === undefined
        ? undefined
        : enumValue<JobCostUnit>(input.unit, jobCostUnits, 'unit'),
    unitCost: optionalNullableMoney(input.unitCost, 'unitCost'),
    totalCost: optionalMoney(input.totalCost, 'totalCost'),
    currency: optionalCurrency(input.currency),
    taxRate: optionalNullableTaxRate(input.taxRate),
    costDate: optionalDate(input.costDate),
    vendorName: optionalNullableText(input.vendorName, 'vendorName', 200),
    receiptReference: optionalNullableText(
      input.receiptReference,
      'receiptReference',
      120,
    ),
    notes: optionalNullableText(input.notes, 'notes', 4_000),
  };

  if (Object.values(payload).every((value) => value === undefined)) {
    throw new BadRequestException('Mindestens ein Kostenfeld muss aktualisiert werden.');
  }

  return payload;
}
