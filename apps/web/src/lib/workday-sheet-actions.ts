'use server';

import type {
  WorkdaySheetRowCreateInput,
  WorkdaySheetStatusUpdateInput,
} from '@einsatzpilot/types';
import { redirect } from 'next/navigation';

import {
  addWorkdaySheetRowData,
  createWorkdaySheetData,
  deleteWorkdaySheetRowData,
  transitionWorkdaySheetData,
  updateWorkdaySheetData,
  updateWorkdaySheetRowData,
} from './workday-sheets';

function required(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${key} ist erforderlich.`);
  return value.trim();
}

function optional(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function nullable(formData: FormData, key: string) {
  return optional(formData, key) ?? null;
}

function rowInput(formData: FormData): WorkdaySheetRowCreateInput {
  return {
    startTime: optional(formData, 'startTime'),
    endTime: optional(formData, 'endTime'),
    plannedText: required(formData, 'plannedText'),
    notes: optional(formData, 'notes'),
    customerId: optional(formData, 'customerId'),
    addressId: optional(formData, 'addressId'),
    objectId: optional(formData, 'objectId'),
    objectAreaId: optional(formData, 'objectAreaId'),
    jobId: optional(formData, 'jobId'),
  };
}

function redirectList(values: Record<string, string | undefined>): never {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => value && params.set(key, value));
  redirect(params.size ? `/workday-sheets?${params.toString()}` : '/workday-sheets');
}

function redirectDetail(sheetId: string, values: Record<string, string | undefined>): never {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => value && params.set(key, value));
  redirect(
    params.size
      ? `/workday-sheets/${sheetId}?${params.toString()}`
      : `/workday-sheets/${sheetId}`,
  );
}

export async function createWorkdaySheetAction(formData: FormData) {
  try {
    const result = await createWorkdaySheetData({
      date: required(formData, 'date'),
      title: optional(formData, 'title'),
      teamId: optional(formData, 'teamId'),
      workerUserId: optional(formData, 'workerUserId'),
      internalNotes: optional(formData, 'internalNotes'),
      rows: [rowInput(formData)],
    });
    if (!result.ok || !result.data) redirectList({ error: result.error });
    redirectDetail(result.data.workdaySheet.id, { notice: 'sheet-created' });
  } catch (error) {
    redirectList({
      error: error instanceof Error ? error.message : 'Tagesblatt konnte nicht erstellt werden.',
    });
  }
}

export async function updateWorkdaySheetAction(sheetId: string, formData: FormData) {
  try {
    const result = await updateWorkdaySheetData(sheetId, {
      date: required(formData, 'date'),
      title: nullable(formData, 'title'),
      teamId: nullable(formData, 'teamId'),
      workerUserId: nullable(formData, 'workerUserId'),
      internalNotes: nullable(formData, 'internalNotes'),
    });
    redirectDetail(sheetId, result.ok ? { notice: 'sheet-updated' } : { error: result.error });
  } catch (error) {
    redirectDetail(sheetId, {
      error: error instanceof Error ? error.message : 'Tagesblatt konnte nicht gespeichert werden.',
    });
  }
}

export async function addWorkdaySheetRowAction(sheetId: string, formData: FormData) {
  try {
    const result = await addWorkdaySheetRowData(sheetId, rowInput(formData));
    redirectDetail(sheetId, result.ok ? { notice: 'row-added' } : { error: result.error });
  } catch (error) {
    redirectDetail(sheetId, {
      error: error instanceof Error ? error.message : 'Zeile konnte nicht angelegt werden.',
    });
  }
}

export async function updatePlannedWorkdaySheetRowAction(
  sheetId: string,
  rowId: string,
  formData: FormData,
) {
  try {
    const row = rowInput(formData);
    const result = await updateWorkdaySheetRowData(sheetId, rowId, {
      ...row,
      startTime: row.startTime ?? null,
      endTime: row.endTime ?? null,
      notes: row.notes ?? null,
      customerId: row.customerId ?? null,
      addressId: row.addressId ?? null,
      objectId: row.objectId ?? null,
      objectAreaId: row.objectAreaId ?? null,
      jobId: row.jobId ?? null,
    });
    redirectDetail(sheetId, result.ok ? { notice: 'row-updated' } : { error: result.error });
  } catch (error) {
    redirectDetail(sheetId, {
      error: error instanceof Error ? error.message : 'Zeile konnte nicht gespeichert werden.',
    });
  }
}

export async function updateActualWorkdaySheetRowAction(
  sheetId: string,
  rowId: string,
  formData: FormData,
) {
  try {
    const result = await updateWorkdaySheetRowData(sheetId, rowId, {
      actualText: nullable(formData, 'actualText'),
    });
    redirectDetail(sheetId, result.ok ? { notice: 'actual-updated' } : { error: result.error });
  } catch (error) {
    redirectDetail(sheetId, {
      error: error instanceof Error ? error.message : 'Ist-Arbeit konnte nicht gespeichert werden.',
    });
  }
}

export async function deleteWorkdaySheetRowAction(sheetId: string, rowId: string) {
  try {
    const result = await deleteWorkdaySheetRowData(sheetId, rowId);
    redirectDetail(sheetId, result.ok ? { notice: 'row-deleted' } : { error: result.error });
  } catch (error) {
    redirectDetail(sheetId, {
      error: error instanceof Error ? error.message : 'Zeile konnte nicht entfernt werden.',
    });
  }
}

export async function transitionWorkdaySheetAction(
  sheetId: string,
  status: WorkdaySheetStatusUpdateInput['status'],
  formData: FormData,
) {
  try {
    const result = await transitionWorkdaySheetData(sheetId, {
      status,
      reviewNotes: status === 'REVIEWED' ? optional(formData, 'reviewNotes') : undefined,
    });
    redirectDetail(
      sheetId,
      result.ok ? { notice: `status-${status.toLowerCase()}` } : { error: result.error },
    );
  } catch (error) {
    redirectDetail(sheetId, {
      error: error instanceof Error ? error.message : 'Status konnte nicht geaendert werden.',
    });
  }
}
