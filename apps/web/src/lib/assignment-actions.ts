'use server';

import type {
  AssignmentEntityType,
  AssignmentKind,
  AssignmentStatus,
} from '@einsatzpilot/types';
import { redirect } from 'next/navigation';

import { createAssignmentData, updateAssignmentData } from './assignments';

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

function optionalIsoDate(formData: FormData, key: string) {
  const value = optionalString(formData, key);
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${key} ist kein gueltiges Datum.`);
  }
  return date.toISOString();
}

function optionalNullableIsoDate(formData: FormData, key: string) {
  return optionalIsoDate(formData, key) ?? null;
}

function assignmentEntity(formData: FormData, key: string) {
  const value = requiredString(formData, key);
  const separator = value.indexOf(':');
  const type = value.slice(0, separator) as AssignmentEntityType;
  const id = value.slice(separator + 1);

  if (separator < 1 || !entityTypes.includes(type) || !id) {
    throw new Error(`${key} ist ungueltig.`);
  }

  return { type, id };
}

function assignmentKind(formData: FormData): AssignmentKind {
  const value = requiredString(formData, 'kind');
  if (
    value === 'RESPONSIBLE' ||
    value === 'SCHEDULED' ||
    value === 'ALLOCATED' ||
    value === 'RESERVED' ||
    value === 'SUPPORTING' ||
    value === 'OTHER'
  ) {
    return value;
  }
  throw new Error('Zuweisungsart ist ungueltig.');
}

function assignmentStatus(formData: FormData): AssignmentStatus {
  const value = requiredString(formData, 'status');
  if (value === 'ACTIVE' || value === 'PLANNED' || value === 'ENDED' || value === 'CANCELED') {
    return value;
  }
  throw new Error('Zuweisungsstatus ist ungueltig.');
}

function redirectWith(values: Record<string, string | undefined>): never {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });
  redirect(params.size ? `/assignments?${params.toString()}` : '/assignments');
}

export async function createAssignmentAction(formData: FormData) {
  try {
    const source = assignmentEntity(formData, 'source');
    const target = assignmentEntity(formData, 'target');
    const result = await createAssignmentData({
      sourceType: source.type,
      sourceId: source.id,
      targetType: target.type,
      targetId: target.id,
      kind: assignmentKind(formData),
      status: assignmentStatus(formData),
      startsAt: optionalIsoDate(formData, 'startsAt'),
      endsAt: optionalIsoDate(formData, 'endsAt'),
      notes: optionalString(formData, 'notes'),
    });
    redirectWith(result.ok ? { notice: 'assignment-created' } : { error: result.error });
  } catch (error) {
    redirectWith({
      error: error instanceof Error ? error.message : 'Zuweisung konnte nicht erstellt werden.',
    });
  }
}

export async function updateAssignmentAction(assignmentId: string, formData: FormData) {
  try {
    const result = await updateAssignmentData(assignmentId, {
      status: assignmentStatus(formData),
      startsAt: optionalNullableIsoDate(formData, 'startsAt'),
      endsAt: optionalNullableIsoDate(formData, 'endsAt'),
      notes: optionalNullableString(formData, 'notes'),
    });
    redirectWith(result.ok ? { notice: 'assignment-updated' } : { error: result.error });
  } catch (error) {
    redirectWith({
      error: error instanceof Error ? error.message : 'Zuweisung konnte nicht aktualisiert werden.',
    });
  }
}
