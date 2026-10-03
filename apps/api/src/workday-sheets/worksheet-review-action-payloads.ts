import { BadRequestException } from '@nestjs/common';

import type {
  JobPriority,
  WorksheetFollowUpJobCreateInput,
} from '@einsatzpilot/types';

function payloadObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new BadRequestException('Payload muss ein JSON-Objekt sein.');
  }
  return value as Record<string, unknown>;
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

function optionalNullableId(value: unknown, field: string) {
  if (value === null) return null;
  return optionalText(value, field, 191);
}

function isoDate(value: unknown, field: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new BadRequestException(`${field} ist erforderlich.`);
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException(`${field} ist kein gueltiges ISO-Datum.`);
  }
  return parsed;
}

function optionalIsoDate(value: unknown, field: string) {
  if (value == null || value === '') return undefined;
  return isoDate(value, field);
}

function priority(value: unknown): JobPriority {
  if (value !== 'LOW' && value !== 'NORMAL' && value !== 'HIGH' && value !== 'URGENT') {
    throw new BadRequestException('priority ist ungueltig.');
  }
  return value;
}

export function normalizeWorksheetFollowUpJobCreateInput(
  input: WorksheetFollowUpJobCreateInput,
) {
  const raw = payloadObject(input);
  const allowed = [
    'title',
    'description',
    'customerName',
    'location',
    'scheduledStart',
    'scheduledEnd',
    'priority',
    'teamId',
    'customerId',
    'addressId',
    'objectId',
    'objectAreaId',
  ];
  const invalid = Object.keys(raw).filter((key) => !allowed.includes(key));
  if (invalid.length) {
    throw new BadRequestException(`Nicht erlaubte Felder: ${invalid.join(', ')}.`);
  }

  const scheduledStart = isoDate(raw.scheduledStart, 'scheduledStart');
  const scheduledEnd = optionalIsoDate(raw.scheduledEnd, 'scheduledEnd');
  if (scheduledEnd && scheduledEnd <= scheduledStart) {
    throw new BadRequestException('scheduledEnd muss nach scheduledStart liegen.');
  }

  return {
    title: requiredText(raw.title, 'title', 200),
    description: optionalText(raw.description, 'description', 10_000),
    customerName: requiredText(raw.customerName, 'customerName', 200),
    location: requiredText(raw.location, 'location', 500),
    scheduledStart,
    scheduledEnd,
    priority: priority(raw.priority),
    teamId: optionalNullableId(raw.teamId, 'teamId'),
    customerId: optionalNullableId(raw.customerId, 'customerId'),
    addressId: optionalNullableId(raw.addressId, 'addressId'),
    objectId: optionalNullableId(raw.objectId, 'objectId'),
    objectAreaId: optionalNullableId(raw.objectAreaId, 'objectAreaId'),
  };
}
