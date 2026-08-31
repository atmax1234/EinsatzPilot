import type {
  WorkdaySheetCreateInput,
  WorkdaySheetDetailResponse,
  WorkdaySheetListResponse,
  WorkdaySheetOptionsResponse,
  WorkdaySheetRowCreateInput,
  WorkdaySheetRowUpdateInput,
  WorkdaySheetStatus,
  WorkdaySheetStatusUpdateInput,
  WorkdaySheetUpdateInput,
} from '@einsatzpilot/types';

import { fetchApiJson } from './api';
import { getStoredSessionToken } from './server-auth';

async function token() {
  const value = await getStoredSessionToken();
  if (!value) throw new Error('Session-Token fehlt.');
  return value;
}

export function getWorkdaySheetStatusLabel(status: WorkdaySheetStatus) {
  return {
    DRAFT: 'Entwurf',
    SENT: 'Gesendet',
    SUBMITTED: 'Abgegeben',
    REVIEWED: 'Geprueft',
    ARCHIVED: 'Archiviert',
  }[status];
}

export async function getWorkdaySheetsData() {
  return fetchApiJson<WorkdaySheetListResponse>('/api/workday-sheets', {
    authToken: await token(),
  });
}

export async function getWorkdaySheetData(sheetId: string) {
  return fetchApiJson<WorkdaySheetDetailResponse>(`/api/workday-sheets/${sheetId}`, {
    authToken: await token(),
  });
}

export async function getWorkdaySheetOptionsData() {
  return fetchApiJson<WorkdaySheetOptionsResponse>('/api/workday-sheets/options', {
    authToken: await token(),
  });
}

export async function createWorkdaySheetData(input: WorkdaySheetCreateInput) {
  return fetchApiJson<WorkdaySheetDetailResponse>('/api/workday-sheets', {
    authToken: await token(),
    method: 'POST',
    json: input,
  });
}

export async function updateWorkdaySheetData(sheetId: string, input: WorkdaySheetUpdateInput) {
  return fetchApiJson<WorkdaySheetDetailResponse>(`/api/workday-sheets/${sheetId}`, {
    authToken: await token(),
    method: 'PATCH',
    json: input,
  });
}

export async function addWorkdaySheetRowData(
  sheetId: string,
  input: WorkdaySheetRowCreateInput,
) {
  return fetchApiJson<WorkdaySheetDetailResponse>(`/api/workday-sheets/${sheetId}/rows`, {
    authToken: await token(),
    method: 'POST',
    json: input,
  });
}

export async function updateWorkdaySheetRowData(
  sheetId: string,
  rowId: string,
  input: WorkdaySheetRowUpdateInput,
) {
  return fetchApiJson<WorkdaySheetDetailResponse>(
    `/api/workday-sheets/${sheetId}/rows/${rowId}`,
    { authToken: await token(), method: 'PATCH', json: input },
  );
}

export async function deleteWorkdaySheetRowData(sheetId: string, rowId: string) {
  return fetchApiJson<WorkdaySheetDetailResponse>(
    `/api/workday-sheets/${sheetId}/rows/${rowId}`,
    { authToken: await token(), method: 'DELETE' },
  );
}

export async function transitionWorkdaySheetData(
  sheetId: string,
  input: WorkdaySheetStatusUpdateInput,
) {
  return fetchApiJson<WorkdaySheetDetailResponse>(`/api/workday-sheets/${sheetId}/status`, {
    authToken: await token(),
    method: 'PATCH',
    json: input,
  });
}
