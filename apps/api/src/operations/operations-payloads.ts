import { BadRequestException } from '@nestjs/common';

import type {
  JobCreateInput,
  JobPriority,
  JobStatusTransitionInput,
  JobUpdateInput,
  TeamCreateInput,
  TeamUpdateInput,
} from '@einsatzpilot/types';

function ensureNonEmptyString(value: unknown, fieldName: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new BadRequestException(`${fieldName} ist erforderlich.`);
  }

  return value.trim();
}

function ensureOptionalString(value: unknown) {
  if (value == null) {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new BadRequestException('Ungueltiger Textwert im Payload.');
  }

  const trimmed = value.trim();
  return trimmed || undefined;
}

function ensureOptionalNullableString(value: unknown) {
  if (value === null) {
    return null;
  }

  return ensureOptionalString(value);
}

function ensureIsoDate(value: unknown, fieldName: string) {
  if (typeof value !== 'string') {
    throw new BadRequestException(`${fieldName} muss ein ISO-Datum sein.`);
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException(`${fieldName} ist kein gueltiges Datum.`);
  }

  return parsed;
}

function ensureOptionalIsoDate(value: unknown, fieldName: string) {
  if (value == null) {
    return undefined;
  }

  return ensureIsoDate(value, fieldName);
}

function ensureOptionalNullableIsoDate(value: unknown, fieldName: string) {
  if (value === null) {
    return null;
  }

  return ensureOptionalIsoDate(value, fieldName);
}

function ensurePriority(value: unknown): JobPriority {
  if (value !== 'LOW' && value !== 'NORMAL' && value !== 'HIGH' && value !== 'URGENT') {
    throw new BadRequestException('priority ist ungueltig.');
  }

  return value;
}

export function normalizeJobCreateInput(input: JobCreateInput) {
  return {
    title: ensureNonEmptyString(input.title, 'title'),
    description: ensureOptionalString(input.description),
    customerName: ensureNonEmptyString(input.customerName, 'customerName'),
    location: ensureNonEmptyString(input.location, 'location'),
    scheduledStart: ensureIsoDate(input.scheduledStart, 'scheduledStart'),
    scheduledEnd: ensureOptionalIsoDate(input.scheduledEnd, 'scheduledEnd'),
    priority: ensurePriority(input.priority),
    teamId: ensureOptionalString(input.teamId),
  };
}

export function normalizeJobUpdateInput(input: JobUpdateInput) {
  return {
    title: input.title === undefined ? undefined : ensureNonEmptyString(input.title, 'title'),
    description: input.description === undefined ? undefined : ensureOptionalString(input.description),
    customerName:
      input.customerName === undefined
        ? undefined
        : ensureNonEmptyString(input.customerName, 'customerName'),
    location: input.location === undefined ? undefined : ensureNonEmptyString(input.location, 'location'),
    scheduledStart:
      input.scheduledStart === undefined
        ? undefined
        : ensureIsoDate(input.scheduledStart, 'scheduledStart'),
    scheduledEnd:
      input.scheduledEnd === undefined
        ? undefined
        : ensureOptionalNullableIsoDate(input.scheduledEnd, 'scheduledEnd'),
    priority: input.priority === undefined ? undefined : ensurePriority(input.priority),
    teamId: input.teamId === undefined ? undefined : ensureOptionalNullableString(input.teamId),
  };
}

export function normalizeJobStatusTransitionInput(input: JobStatusTransitionInput) {
  if (
    input.status !== 'PLANNED' &&
    input.status !== 'IN_PROGRESS' &&
    input.status !== 'DONE' &&
    input.status !== 'CANCELED'
  ) {
    throw new BadRequestException('status ist ungueltig.');
  }

  return input;
}

export function normalizeTeamCreateInput(input: TeamCreateInput) {
  return {
    name: ensureNonEmptyString(input.name, 'name'),
    code: ensureOptionalString(input.code),
    specialty: ensureOptionalString(input.specialty),
    status: input.status ?? 'ACTIVE',
    currentAssignment: ensureOptionalString(input.currentAssignment),
  };
}

export function normalizeTeamUpdateInput(input: TeamUpdateInput) {
  return {
    name: input.name === undefined ? undefined : ensureNonEmptyString(input.name, 'name'),
    code: input.code === undefined ? undefined : ensureOptionalNullableString(input.code),
    specialty:
      input.specialty === undefined ? undefined : ensureOptionalNullableString(input.specialty),
    status: input.status,
    currentAssignment:
      input.currentAssignment === undefined
        ? undefined
        : ensureOptionalNullableString(input.currentAssignment),
  };
}
