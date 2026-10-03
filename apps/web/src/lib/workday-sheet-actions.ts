'use server';

import type {
  JobCostKind,
  JobCostUnit,
  JobPriority,
  WorkdaySheetRowCreateInput,
  WorkdaySheetStatusUpdateInput,
  WorksheetStructuredJobReportType,
} from '@einsatzpilot/types';
import { redirect } from 'next/navigation';

import {
  addWorkdaySheetRowData,
  createFollowUpJobFromWorksheetRowData,
  createJobCostLineFromWorksheetRowData,
  createJobReportFromWorksheetRowData,
  createWorkdaySheetData,
  deleteWorkdaySheetRowData,
  transitionWorkdaySheetData,
  updateWorkdaySheetData,
  updateWorkdaySheetRowData,
} from './workday-sheets';

function required(formData: FormData, key: string, label = key) {
  const value = formData.get(key);
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} ist erforderlich.`);
  return value.trim();
}

function optional(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function nullable(formData: FormData, key: string) {
  return optional(formData, key) ?? null;
}

function isoDateTime(formData: FormData, key: string, requiredValue: boolean) {
  const value = optional(formData, key);
  if (!value && !requiredValue) return undefined;
  if (!value) throw new Error(`${key} ist erforderlich.`);
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new Error(`${key} ist kein gueltiges Datum.`);
  return parsed.toISOString();
}

function jobPriority(formData: FormData): JobPriority {
  const value = required(formData, 'priority', 'Priorität');
  if (value === 'LOW' || value === 'NORMAL' || value === 'HIGH' || value === 'URGENT') {
    return value;
  }
  throw new Error('Priorität ist ungültig.');
}

function optionalNumber(formData: FormData, key: string) {
  const value = optional(formData, key);
  if (value === undefined) return undefined;
  const parsed = Number(value.replace(',', '.'));
  if (!Number.isFinite(parsed)) throw new Error(`${key} muss eine gueltige Zahl sein.`);
  return parsed;
}

function requiredNumber(formData: FormData, key: string, label: string) {
  const value = optionalNumber(formData, key);
  if (value === undefined) throw new Error(`${label} ist erforderlich.`);
  return value;
}

function jobCostKind(formData: FormData): JobCostKind {
  const value = required(formData, 'kind', 'Kostenart') as JobCostKind;
  const allowed: JobCostKind[] = [
    'MATERIAL_PURCHASE',
    'MATERIAL_USED',
    'LABOR',
    'TRAVEL',
    'EXTERNAL_SERVICE',
    'FEE',
    'OTHER',
  ];
  if (!allowed.includes(value)) throw new Error('Kostenart ist ungültig.');
  return value;
}

function jobCostUnit(formData: FormData): JobCostUnit {
  const value = required(formData, 'unit', 'Einheit') as JobCostUnit;
  const allowed: JobCostUnit[] = [
    'PIECE',
    'HOUR',
    'KILOMETER',
    'KG',
    'LITER',
    'METER',
    'SQUARE_METER',
    'CUBIC_METER',
    'FLAT_RATE',
    'OTHER',
  ];
  if (!allowed.includes(value)) throw new Error('Einheit ist ungültig.');
  return value;
}

function structuredReportType(formData: FormData): WorksheetStructuredJobReportType {
  const value = required(formData, 'type', 'Berichtstyp') as WorksheetStructuredJobReportType;
  const allowed: WorksheetStructuredJobReportType[] = [
    'WORKER_FINDING',
    'WORK_COMPLETION',
    'INCIDENT_REPORT',
    'FOLLOW_UP_REQUEST',
  ];
  if (!allowed.includes(value)) throw new Error('Berichtstyp ist ungültig.');
  return value;
}

function rowInput(formData: FormData): WorkdaySheetRowCreateInput {
  return {
    startTime: optional(formData, 'startTime'),
    endTime: optional(formData, 'endTime'),
    plannedText: required(formData, 'plannedText', 'Geplante Arbeit'),
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

function redirectAfterSheetAction(
  sheetId: string,
  returnTo: string | undefined,
  values: Record<string, string | undefined>,
): never {
  if (returnTo === '/workday-sheets/today') {
    const params = new URLSearchParams();
    Object.entries(values).forEach(([key, value]) => value && params.set(key, value));
    redirect(params.size ? `${returnTo}?${params.toString()}` : returnTo);
  }
  redirectDetail(sheetId, values);
}

export async function createWorkdaySheetAction(formData: FormData) {
  try {
    const result = await createWorkdaySheetData({
      date: required(formData, 'date', 'Arbeitstag'),
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
      date: required(formData, 'date', 'Arbeitstag'),
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
  const returnTo = optional(formData, 'returnTo');
  try {
    const result = await updateWorkdaySheetRowData(sheetId, rowId, {
      actualText: nullable(formData, 'actualText'),
    });
    redirectAfterSheetAction(
      sheetId,
      returnTo,
      result.ok ? { notice: 'actual-updated' } : { error: result.error },
    );
  } catch (error) {
    redirectAfterSheetAction(sheetId, returnTo, {
      error:
        error instanceof Error
          ? error.message
          : 'Tatsaechliche Arbeit konnte nicht gespeichert werden.',
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
  const returnTo = optional(formData, 'returnTo');
  try {
    const result = await transitionWorkdaySheetData(sheetId, {
      status,
      reviewNotes: status === 'REVIEWED' ? optional(formData, 'reviewNotes') : undefined,
    });
    redirectAfterSheetAction(
      sheetId,
      returnTo,
      result.ok ? { notice: `status-${status.toLowerCase()}` } : { error: result.error },
    );
  } catch (error) {
    redirectAfterSheetAction(sheetId, returnTo, {
      error: error instanceof Error ? error.message : 'Status konnte nicht geaendert werden.',
    });
  }
}

export async function createFollowUpJobFromWorksheetRowAction(
  sheetId: string,
  rowId: string,
  formData: FormData,
) {
  try {
    const result = await createFollowUpJobFromWorksheetRowData(sheetId, rowId, {
      title: required(formData, 'title', 'Auftragstitel'),
      description: optional(formData, 'description'),
      customerName: required(formData, 'customerName', 'Kundenname'),
      location: required(formData, 'location', 'Einsatzort'),
      scheduledStart: isoDateTime(formData, 'scheduledStart', true)!,
      scheduledEnd: isoDateTime(formData, 'scheduledEnd', false),
      priority: jobPriority(formData),
      teamId: nullable(formData, 'teamId'),
      customerId: nullable(formData, 'customerId'),
      addressId: nullable(formData, 'addressId'),
      objectId: nullable(formData, 'objectId'),
      objectAreaId: nullable(formData, 'objectAreaId'),
    });
    redirectDetail(
      sheetId,
      result.ok && result.data
        ? { notice: result.data.replayed ? 'follow-up-job-existing' : 'follow-up-job-created' }
        : { error: result.error ?? 'Folgeauftrag konnte nicht erstellt werden.' },
    );
  } catch (error) {
    redirectDetail(sheetId, {
      error: error instanceof Error ? error.message : 'Folgeauftrag konnte nicht erstellt werden.',
    });
  }
}

export async function createJobCostLineFromWorksheetRowAction(
  sheetId: string,
  rowId: string,
  formData: FormData,
) {
  try {
    const result = await createJobCostLineFromWorksheetRowData(sheetId, rowId, {
      targetJobId: required(formData, 'targetJobId', 'Zielauftrag'),
      costLine: {
        itemId: optional(formData, 'itemId'),
        kind: jobCostKind(formData),
        description: required(formData, 'description', 'Beschreibung'),
        quantity: requiredNumber(formData, 'quantity', 'Menge'),
        unit: jobCostUnit(formData),
        unitCost: optionalNumber(formData, 'unitCost'),
        totalCost: optionalNumber(formData, 'totalCost'),
        currency: optional(formData, 'currency'),
        taxRate: optionalNumber(formData, 'taxRate'),
        costDate: optional(formData, 'costDate'),
        vendorName: optional(formData, 'vendorName'),
        receiptReference: optional(formData, 'receiptReference'),
        notes: optional(formData, 'notes'),
      },
    });
    redirectDetail(
      sheetId,
      result.ok && result.data
        ? { notice: result.data.replayed ? 'job-cost-existing' : 'job-cost-created' }
        : { error: result.error ?? 'Kostenzeile konnte nicht erstellt werden.' },
    );
  } catch (error) {
    redirectDetail(sheetId, {
      error: error instanceof Error ? error.message : 'Kostenzeile konnte nicht erstellt werden.',
    });
  }
}

export async function createJobReportFromWorksheetRowAction(
  sheetId: string,
  rowId: string,
  formData: FormData,
) {
  try {
    const result = await createJobReportFromWorksheetRowData(sheetId, rowId, {
      targetJobId: required(formData, 'targetJobId', 'Zielauftrag'),
      report: {
        summary: required(formData, 'summary', 'Kurzfassung'),
        details: optional(formData, 'details'),
        teamId: optional(formData, 'teamId'),
        type: structuredReportType(formData),
        findingSummary: optional(formData, 'findingSummary'),
        workPerformed: optional(formData, 'workPerformed'),
        workStillNeeded: optional(formData, 'workStillNeeded'),
        followUpRequired: formData.get('followUpRequired') === 'on',
        followUpNotes: optional(formData, 'followUpNotes'),
      },
    });
    redirectDetail(
      sheetId,
      result.ok && result.data
        ? { notice: result.data.replayed ? 'job-report-existing' : 'job-report-created' }
        : { error: result.error ?? 'Auftragsbericht konnte nicht erstellt werden.' },
    );
  } catch (error) {
    redirectDetail(sheetId, {
      error:
        error instanceof Error ? error.message : 'Auftragsbericht konnte nicht erstellt werden.',
    });
  }
}
