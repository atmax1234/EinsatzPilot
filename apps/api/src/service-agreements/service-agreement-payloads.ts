import { BadRequestException } from '@nestjs/common';

import type {
  RecurringDutyCadenceUnit,
  RecurringObjectDutyCreateInput,
  RecurringObjectDutyUpdateInput,
  ServiceAgreementCreateInput,
  ServiceAgreementStatus,
  ServiceAgreementStatusUpdateInput,
  ServiceAgreementUpdateInput,
} from '@einsatzpilot/types';

function payloadObject(value: unknown, field = 'Payload'): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new BadRequestException(`${field} muss ein JSON-Objekt sein.`);
  }
  return value as Record<string, unknown>;
}

function assertAllowedKeys(value: Record<string, unknown>, allowed: readonly string[]) {
  const invalid = Object.keys(value).filter((key) => !allowed.includes(key));
  if (invalid.length) {
    throw new BadRequestException(`Nicht erlaubte Felder: ${invalid.join(', ')}.`);
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
  if (value == null || value === '') return undefined;
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
  if (value === null || value === '') return null;
  return optionalText(value, field, maxLength);
}

function optionalId(value: unknown, field: string) {
  return optionalText(value, field, 191);
}

function optionalNullableId(value: unknown, field: string) {
  return optionalNullableText(value, field, 191);
}

function dateOnly(value: unknown, field: string) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new BadRequestException(`${field} muss ein Datum im Format YYYY-MM-DD sein.`);
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new BadRequestException(`${field} ist kein gueltiges Kalenderdatum.`);
  }
  return parsed;
}

function optionalNullableDate(value: unknown, field: string) {
  if (value === null || value === '') return null;
  return dateOnly(value, field);
}

function timezone(value: unknown) {
  const normalized = requiredText(value, 'timezone', 100);
  try {
    new Intl.DateTimeFormat('de-DE', { timeZone: normalized }).format(new Date(0));
  } catch {
    throw new BadRequestException('timezone muss eine gueltige IANA-Zeitzone sein.');
  }
  return normalized;
}

function cadenceUnit(value: unknown): RecurringDutyCadenceUnit {
  if (value !== 'DAY' && value !== 'WEEK' && value !== 'MONTH' && value !== 'YEAR') {
    throw new BadRequestException('cadenceUnit muss DAY, WEEK, MONTH oder YEAR sein.');
  }
  return value;
}

function cadenceInterval(value: unknown) {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 999) {
    throw new BadRequestException('cadenceInterval muss eine ganze Zahl zwischen 1 und 999 sein.');
  }
  return value;
}

function timeOnly(value: unknown, field: string) {
  if (value == null || value === '') return undefined;
  if (typeof value !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    throw new BadRequestException(`${field} muss im Format HH:mm angegeben werden.`);
  }
  return value;
}

function nullableTimeOnly(value: unknown, field: string) {
  if (value === null || value === '') return null;
  return timeOnly(value, field);
}

function assertTimeRange(startTime?: string | null, endTime?: string | null) {
  if (startTime && endTime && endTime <= startTime) {
    throw new BadRequestException('endTime muss nach startTime liegen.');
  }
}

function optionalBoolean(value: unknown, field: string) {
  if (value === undefined) return undefined;
  if (typeof value !== 'boolean') {
    throw new BadRequestException(`${field} muss true oder false sein.`);
  }
  return value;
}

const dutyFields = [
  'plannedText',
  'notes',
  'cadenceUnit',
  'cadenceInterval',
  'firstDueDate',
  'startTime',
  'endTime',
  'isActive',
] as const;

const agreementFields = [
  'title',
  'description',
  'effectiveFrom',
  'effectiveUntil',
  'timezone',
  'customerId',
  'addressId',
  'objectId',
  'objectAreaId',
  'internalNotes',
] as const;

export function normalizeRecurringObjectDutyCreateInput(
  input: RecurringObjectDutyCreateInput,
) {
  const raw = payloadObject(input, 'duty');
  assertAllowedKeys(raw, dutyFields);
  const normalized = {
    plannedText: requiredText(raw.plannedText, 'plannedText', 4_000),
    notes: optionalText(raw.notes, 'notes', 4_000),
    cadenceUnit: cadenceUnit(raw.cadenceUnit),
    cadenceInterval: cadenceInterval(raw.cadenceInterval),
    firstDueDate: dateOnly(raw.firstDueDate, 'firstDueDate'),
    startTime: timeOnly(raw.startTime, 'startTime'),
    endTime: timeOnly(raw.endTime, 'endTime'),
    isActive: optionalBoolean(raw.isActive, 'isActive') ?? true,
  };
  assertTimeRange(normalized.startTime, normalized.endTime);
  return normalized;
}

export function normalizeRecurringObjectDutyUpdateInput(
  input: RecurringObjectDutyUpdateInput,
) {
  const raw = payloadObject(input, 'duty');
  assertAllowedKeys(raw, dutyFields);
  if (!Object.keys(raw).length) {
    throw new BadRequestException('Mindestens ein Pflichtfeld muss geaendert werden.');
  }
  const normalized = {
    plannedText:
      raw.plannedText === undefined
        ? undefined
        : requiredText(raw.plannedText, 'plannedText', 4_000),
    notes:
      raw.notes === undefined ? undefined : optionalNullableText(raw.notes, 'notes', 4_000),
    cadenceUnit:
      raw.cadenceUnit === undefined ? undefined : cadenceUnit(raw.cadenceUnit),
    cadenceInterval:
      raw.cadenceInterval === undefined ? undefined : cadenceInterval(raw.cadenceInterval),
    firstDueDate:
      raw.firstDueDate === undefined ? undefined : dateOnly(raw.firstDueDate, 'firstDueDate'),
    startTime:
      raw.startTime === undefined ? undefined : nullableTimeOnly(raw.startTime, 'startTime'),
    endTime: raw.endTime === undefined ? undefined : nullableTimeOnly(raw.endTime, 'endTime'),
    isActive: optionalBoolean(raw.isActive, 'isActive'),
  };
  return normalized;
}

export function assertRecurringDutyTimeRange(
  startTime?: string | null,
  endTime?: string | null,
) {
  assertTimeRange(startTime, endTime);
}

export function normalizeServiceAgreementCreateInput(input: ServiceAgreementCreateInput) {
  const raw = payloadObject(input);
  assertAllowedKeys(raw, [...agreementFields, 'duties']);
  if (!Array.isArray(raw.duties) || raw.duties.length < 1 || raw.duties.length > 100) {
    throw new BadRequestException('duties muss zwischen 1 und 100 Pflichtzeilen enthalten.');
  }
  const normalized = {
    title: requiredText(raw.title, 'title', 200),
    description: optionalText(raw.description, 'description', 10_000),
    effectiveFrom: dateOnly(raw.effectiveFrom, 'effectiveFrom'),
    effectiveUntil:
      raw.effectiveUntil === undefined
        ? undefined
        : optionalNullableDate(raw.effectiveUntil, 'effectiveUntil') ?? undefined,
    timezone: timezone(raw.timezone),
    customerId: optionalId(raw.customerId, 'customerId'),
    addressId: optionalId(raw.addressId, 'addressId'),
    objectId: optionalId(raw.objectId, 'objectId'),
    objectAreaId: optionalId(raw.objectAreaId, 'objectAreaId'),
    internalNotes: optionalText(raw.internalNotes, 'internalNotes', 10_000),
    duties: raw.duties.map((duty) =>
      normalizeRecurringObjectDutyCreateInput(duty as RecurringObjectDutyCreateInput),
    ),
  };
  assertEffectiveDateRange(normalized.effectiveFrom, normalized.effectiveUntil);
  return normalized;
}

export function normalizeServiceAgreementUpdateInput(input: ServiceAgreementUpdateInput) {
  const raw = payloadObject(input);
  assertAllowedKeys(raw, agreementFields);
  if (!Object.keys(raw).length) {
    throw new BadRequestException('Mindestens ein Vereinbarungsfeld muss geaendert werden.');
  }
  return {
    title: raw.title === undefined ? undefined : requiredText(raw.title, 'title', 200),
    description:
      raw.description === undefined
        ? undefined
        : optionalNullableText(raw.description, 'description', 10_000),
    effectiveFrom:
      raw.effectiveFrom === undefined ? undefined : dateOnly(raw.effectiveFrom, 'effectiveFrom'),
    effectiveUntil:
      raw.effectiveUntil === undefined
        ? undefined
        : optionalNullableDate(raw.effectiveUntil, 'effectiveUntil'),
    timezone: raw.timezone === undefined ? undefined : timezone(raw.timezone),
    customerId:
      raw.customerId === undefined
        ? undefined
        : optionalNullableId(raw.customerId, 'customerId'),
    addressId:
      raw.addressId === undefined ? undefined : optionalNullableId(raw.addressId, 'addressId'),
    objectId:
      raw.objectId === undefined ? undefined : optionalNullableId(raw.objectId, 'objectId'),
    objectAreaId:
      raw.objectAreaId === undefined
        ? undefined
        : optionalNullableId(raw.objectAreaId, 'objectAreaId'),
    internalNotes:
      raw.internalNotes === undefined
        ? undefined
        : optionalNullableText(raw.internalNotes, 'internalNotes', 10_000),
  };
}

export function assertEffectiveDateRange(effectiveFrom: Date, effectiveUntil?: Date | null) {
  if (effectiveUntil && effectiveUntil < effectiveFrom) {
    throw new BadRequestException('effectiveUntil darf nicht vor effectiveFrom liegen.');
  }
}

export function assertDutyDateWithinAgreement(
  firstDueDate: Date,
  effectiveFrom: Date,
  effectiveUntil?: Date | null,
) {
  if (firstDueDate < effectiveFrom || (effectiveUntil && firstDueDate > effectiveUntil)) {
    throw new BadRequestException(
      'firstDueDate muss innerhalb des Gueltigkeitszeitraums der Vereinbarung liegen.',
    );
  }
}

function optionalStatus(value: unknown): ServiceAgreementStatus | undefined {
  if (value == null || value === '') return undefined;
  if (value !== 'DRAFT' && value !== 'ACTIVE' && value !== 'INACTIVE' && value !== 'ARCHIVED') {
    throw new BadRequestException('status muss DRAFT, ACTIVE, INACTIVE oder ARCHIVED sein.');
  }
  return value;
}

export function normalizeServiceAgreementListFilters(input: unknown) {
  const raw = payloadObject(input, 'query');
  assertAllowedKeys(raw, ['status', 'customerId', 'objectId']);
  return {
    status: optionalStatus(raw.status),
    customerId: optionalId(raw.customerId, 'customerId'),
    objectId: optionalId(raw.objectId, 'objectId'),
  };
}

export function normalizeServiceAgreementStatusUpdateInput(
  input: ServiceAgreementStatusUpdateInput,
) {
  const raw = payloadObject(input);
  assertAllowedKeys(raw, ['status']);
  if (raw.status !== 'ACTIVE' && raw.status !== 'INACTIVE' && raw.status !== 'ARCHIVED') {
    throw new BadRequestException('status muss ACTIVE, INACTIVE oder ARCHIVED sein.');
  }
  return { status: raw.status } as const;
}
