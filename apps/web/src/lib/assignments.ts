import type {
  AssignmentCreateInput,
  AssignmentDetailResponse,
  AssignmentEntityOptionsResponse,
  AssignmentEntityType,
  AssignmentKind,
  AssignmentListItem,
  AssignmentListResponse,
  AssignmentStatus,
  AssignmentUpdateInput,
} from '@einsatzpilot/types';

import { fetchApiJson } from './api';
import { getStoredSessionToken } from './server-auth';

async function getAuthTokenOrThrow() {
  const token = await getStoredSessionToken();

  if (!token) {
    throw new Error('Session-Token fehlt.');
  }

  return token;
}

export function getAssignmentEntityTypeLabel(type: AssignmentEntityType) {
  return {
    USER: 'Person',
    TEAM: 'Team',
    JOB: 'Auftrag',
    CUSTOMER: 'Kunde',
    ADDRESS: 'Adresse',
    OBJECT: 'Objekt',
    OBJECT_AREA: 'Objektbereich',
    ITEM: 'Artikel',
  }[type];
}

export function getAssignmentKindLabel(kind: AssignmentKind) {
  return {
    RESPONSIBLE: 'Verantwortlich',
    SCHEDULED: 'Eingeplant',
    ALLOCATED: 'Zugeteilt',
    RESERVED: 'Reserviert',
    SUPPORTING: 'Unterstuetzend',
    OTHER: 'Sonstige',
  }[kind];
}

export function getAssignmentStatusLabel(status: AssignmentStatus) {
  return {
    ACTIVE: 'Aktiv',
    PLANNED: 'Geplant',
    ENDED: 'Beendet',
    CANCELED: 'Abgebrochen',
  }[status];
}

export async function getAssignmentsData() {
  const token = await getAuthTokenOrThrow();
  return fetchApiJson<AssignmentListResponse>('/api/assignments', { authToken: token });
}

export async function getAssignmentEntityOptionsData() {
  const token = await getAuthTokenOrThrow();
  return fetchApiJson<AssignmentEntityOptionsResponse>('/api/assignments/options', {
    authToken: token,
  });
}

export async function getAssignmentDetailData(assignmentId: string) {
  const token = await getAuthTokenOrThrow();
  return fetchApiJson<AssignmentDetailResponse>(`/api/assignments/${assignmentId}`, {
    authToken: token,
  });
}

export async function createAssignmentData(input: AssignmentCreateInput) {
  const token = await getAuthTokenOrThrow();
  return fetchApiJson<AssignmentListItem>('/api/assignments', {
    authToken: token,
    method: 'POST',
    json: input,
  });
}

export async function updateAssignmentData(
  assignmentId: string,
  input: AssignmentUpdateInput,
) {
  const token = await getAuthTokenOrThrow();
  return fetchApiJson<AssignmentListItem>(`/api/assignments/${assignmentId}`, {
    authToken: token,
    method: 'PATCH',
    json: input,
  });
}
