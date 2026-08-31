import { BadRequestException } from '@nestjs/common';

import type {
  WorkdaySheetCreateInput,
  WorkdaySheetRowCreateInput,
  WorkdaySheetStatusUpdateInput,
  WorkdaySheetUpdateInput,
} from '@einsatzpilot/types';

function payloadObject(value: unknown, field = 'Payload'): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new BadRequestException(`${field} muss ein JSON-Objekt sein.`);
  }

  return value as Record<string, unknown>;
}

function assertAllowedKeys(value: Record<string, unknown>, allowed: string[]) {
  const invalid = Object.keys(value).filter((key) => !allowed.includes(key));
  if (invalid.length) {
    throw new BadRequestException(`Nicht erlaubte Felder: ${invalid.join(', ')}.`);
  }
}

function assertHasKey(value: Record<string, unknown>, field: string) {
  if (!Object.prototype.hasOwnProperty.call(value, field)) {
    throw new BadRequestException(`${field} ist erforderlich.`);
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
  if (value == null || value === '') {
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
  if (value === null || value === '') {
    return null;
  }
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

function timeOnly(value: unknown, field: string) {
  if (value == null || value === '') {
    return undefined;
  }
  if (typeof value !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    throw new BadRequestException(`${field} muss im Format HH:mm angegeben werden.`);
  }
  return value;
}

function nullableTimeOnly(value: unknown, field: string) {
  if (value === null || value === '') {
    return null;
  }
  return timeOnly(value, field);
}

function assertTimeRange(startTime?: string | null, endTime?: string | null) {
  if (startTime && endTime && endTime <= startTime) {
    throw new BadRequestException('endTime muss nach startTime liegen.');
  }
}

const rowFields = [
  'startTime',
  'endTime',
  'plannedText',
  'notes',
  'customerId',
  'addressId',
  'objectId',
  'objectAreaId',
  'jobId',
];

export function normalizeWorkdaySheetRowCreateInput(input: WorkdaySheetRowCreateInput) {
  const raw = payloadObject(input, 'row');
  assertAllowedKeys(raw, rowFields);
  const normalized = {
    startTime: timeOnly(raw.startTime, 'startTime'),
    endTime: timeOnly(raw.endTime, 'endTime'),
    plannedText: requiredText(raw.plannedText, 'plannedText', 4_000),
    notes: optionalText(raw.notes, 'notes', 4_000),
    customerId: optionalId(raw.customerId, 'customerId'),
    addressId: optionalId(raw.addressId, 'addressId'),
    objectId: optionalId(raw.objectId, 'objectId'),
    objectAreaId: optionalId(raw.objectAreaId, 'objectAreaId'),
    jobId: optionalId(raw.jobId, 'jobId'),
  };
  assertTimeRange(normalized.startTime, normalized.endTime);
  return normalized;
}

export function normalizeWorkdaySheetCreateInput(input: WorkdaySheetCreateInput) {
  const raw = payloadObject(input);
  assertAllowedKeys(raw, ['date', 'title', 'teamId', 'workerUserId', 'internalNotes', 'rows']);
  if (!Array.isArray(raw.rows) || raw.rows.length < 1 || raw.rows.length > 100) {
    throw new BadRequestException('rows muss zwischen 1 und 100 geplante Zeilen enthalten.');
  }

  return {
    date: dateOnly(raw.date, 'date'),
    title: optionalText(raw.title, 'title', 200),
    teamId: optionalId(raw.teamId, 'teamId'),
    workerUserId: optionalId(raw.workerUserId, 'workerUserId'),
    internalNotes: optionalText(raw.internalNotes, 'internalNotes', 10_000),
    rows: raw.rows.map((row) =>
      normalizeWorkdaySheetRowCreateInput(row as WorkdaySheetRowCreateInput),
    ),
  };
}

export function normalizeWorkdaySheetUpdateInput(input: WorkdaySheetUpdateInput) {
  const raw = payloadObject(input);
  assertAllowedKeys(raw, ['date', 'title', 'teamId', 'workerUserId', 'internalNotes']);
  if (!Object.keys(raw).length) {
    throw new BadRequestException('Mindestens ein Feld muss geaendert werden.');
  }
  return {
    date: raw.date === undefined ? undefined : dateOnly(raw.date, 'date'),
    title:
      raw.title === undefined ? undefined : optionalNullableText(raw.title, 'title', 200),
    teamId:
      raw.teamId === undefined ? undefined : optionalNullableId(raw.teamId, 'teamId'),
    workerUserId:
      raw.workerUserId === undefined
        ? undefined
        : optionalNullableId(raw.workerUserId, 'workerUserId'),
    internalNotes:
      raw.internalNotes === undefined
        ? undefined
        : optionalNullableText(raw.internalNotes, 'internalNotes', 10_000),
  };
}

export function normalizeWorkdaySheetRowPlannedUpdateInput(
  input: unknown,
) {
  const raw = payloadObject(input);
  assertAllowedKeys(raw, rowFields);
  if (!Object.keys(raw).length) {
    throw new BadRequestException('Mindestens ein Zeilenfeld muss geaendert werden.');
  }
  const normalized = {
    startTime:
      raw.startTime === undefined ? undefined : nullableTimeOnly(raw.startTime, 'startTime'),
    endTime: raw.endTime === undefined ? undefined : nullableTimeOnly(raw.endTime, 'endTime'),
    plannedText:
      raw.plannedText === undefined
        ? undefined
        : requiredText(raw.plannedText, 'plannedText', 4_000),
    notes:
      raw.notes === undefined ? undefined : optionalNullableText(raw.notes, 'notes', 4_000),
    customerId:
      raw.customerId === undefined
        ? undefined
        : optionalNullableId(raw.customerId, 'customerId'),
    addressId:
      raw.addressId === undefined
        ? undefined
        : optionalNullableId(raw.addressId, 'addressId'),
    objectId:
      raw.objectId === undefined ? undefined : optionalNullableId(raw.objectId, 'objectId'),
    objectAreaId:
      raw.objectAreaId === undefined
        ? undefined
        : optionalNullableId(raw.objectAreaId, 'objectAreaId'),
    jobId: raw.jobId === undefined ? undefined : optionalNullableId(raw.jobId, 'jobId'),
  };
  return normalized;
}

export function assertWorkdaySheetRowTimeRange(
  startTime?: string | null,
  endTime?: string | null,
) {
  assertTimeRange(startTime, endTime);
}

export function normalizeWorkdaySheetRowActualUpdateInput(
  input: unknown,
) {
  const raw = payloadObject(input);
  assertAllowedKeys(raw, ['actualText']);
  assertHasKey(raw, 'actualText');
  return {
    actualText: optionalNullableText(raw.actualText, 'actualText', 4_000),
  };
}

export function normalizeWorkdaySheetStatusUpdateInput(input: WorkdaySheetStatusUpdateInput) {
  const raw = payloadObject(input);
  assertAllowedKeys(raw, ['status', 'reviewNotes']);
  if (
    raw.status !== 'SENT' &&
    raw.status !== 'SUBMITTED' &&
    raw.status !== 'REVIEWED' &&
    raw.status !== 'ARCHIVED'
  ) {
    throw new BadRequestException('status ist ungueltig.');
  }
  const reviewNotes = optionalText(raw.reviewNotes, 'reviewNotes', 10_000);
  if (reviewNotes && raw.status !== 'REVIEWED') {
    throw new BadRequestException('reviewNotes sind nur beim Pruefen erlaubt.');
  }
  return { status: raw.status, reviewNotes } as const;
}
