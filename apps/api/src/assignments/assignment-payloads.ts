import { BadRequestException } from '@nestjs/common';

import type {
  AssignmentCreateInput,
  AssignmentEntityType,
  AssignmentKind,
  AssignmentStatus,
  AssignmentUpdateInput,
} from '@einsatzpilot/types';

const entityTypes: AssignmentEntityType[] = [
  'USER',
  'TEAM',
  'JOB',
  'CUSTOMER',
  'ADDRESS',
  'OBJECT',
  'OBJECT_AREA',
  'ITEM',
];
const assignmentKinds: AssignmentKind[] = [
  'RESPONSIBLE',
  'SCHEDULED',
  'ALLOCATED',
  'RESERVED',
  'SUPPORTING',
  'OTHER',
];
const assignmentStatuses: AssignmentStatus[] = [
  'ACTIVE',
  'PLANNED',
  'ENDED',
  'CANCELED',
];

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

function enumValue<T extends string>(value: unknown, allowed: T[], field: string): T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    throw new BadRequestException(`${field} ist ungueltig.`);
  }

  return value as T;
}

function optionalDate(value: unknown, field: string) {
  if (value == null || value === '') {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new BadRequestException(`${field} muss ein ISO-Datum sein.`);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(`${field} muss ein gueltiges ISO-Datum sein.`);
  }

  return date;
}

function optionalNullableDate(value: unknown, field: string) {
  if (value === null || value === '') {
    return null;
  }

  return optionalDate(value, field);
}

export function assertValidAssignmentTimeRange(
  startsAt: Date | null | undefined,
  endsAt: Date | null | undefined,
) {
  if (startsAt && endsAt && endsAt.getTime() <= startsAt.getTime()) {
    throw new BadRequestException('endsAt muss nach startsAt liegen.');
  }
}

export function assertDistinctAssignmentEntities(input: {
  sourceType: AssignmentEntityType;
  sourceId: string;
  targetType: AssignmentEntityType;
  targetId: string;
}) {
  if (input.sourceType === input.targetType && input.sourceId === input.targetId) {
    throw new BadRequestException('Quelle und Ziel einer Zuweisung muessen verschieden sein.');
  }
}

export function normalizeAssignmentCreateInput(input: AssignmentCreateInput) {
  assertPayloadObject(input);
  const payload = {
    sourceType: enumValue(input.sourceType, entityTypes, 'sourceType'),
    sourceId: requiredText(input.sourceId, 'sourceId', 191),
    targetType: enumValue(input.targetType, entityTypes, 'targetType'),
    targetId: requiredText(input.targetId, 'targetId', 191),
    kind: enumValue(input.kind, assignmentKinds, 'kind'),
    status:
      input.status === undefined
        ? ('ACTIVE' as const)
        : enumValue(input.status, assignmentStatuses, 'status'),
    startsAt: optionalDate(input.startsAt, 'startsAt'),
    endsAt: optionalDate(input.endsAt, 'endsAt'),
    notes: optionalText(input.notes, 'notes', 4_000),
  };

  if (payload.status === 'ENDED' || payload.status === 'CANCELED') {
    throw new BadRequestException('Neue Zuweisungen muessen ACTIVE oder PLANNED sein.');
  }

  assertDistinctAssignmentEntities(payload);
  assertValidAssignmentTimeRange(payload.startsAt, payload.endsAt);
  return payload;
}

export function normalizeAssignmentUpdateInput(input: AssignmentUpdateInput) {
  assertPayloadObject(input);
  return {
    status:
      input.status === undefined
        ? undefined
        : enumValue(input.status, assignmentStatuses, 'status'),
    startsAt:
      input.startsAt === undefined
        ? undefined
        : optionalNullableDate(input.startsAt, 'startsAt'),
    endsAt:
      input.endsAt === undefined
        ? undefined
        : optionalNullableDate(input.endsAt, 'endsAt'),
    notes:
      input.notes === undefined ? undefined : optionalNullableText(input.notes, 'notes', 4_000),
  };
}
