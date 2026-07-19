'use server';

import type { JobCostKind, JobCostUnit } from '@einsatzpilot/types';
import { redirect } from 'next/navigation';

import { createJobCostData, updateJobCostData } from './job-costs';

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

function requiredNumber(formData: FormData, key: string) {
  const value = Number(requiredString(formData, key));
  if (!Number.isFinite(value)) {
    throw new Error(`${key} muss eine Zahl sein.`);
  }
  return value;
}

function optionalNumber(formData: FormData, key: string) {
  const raw = optionalString(formData, key);
  if (raw === undefined) {
    return undefined;
  }

  const value = Number(raw);
  if (!Number.isFinite(value)) {
    throw new Error(`${key} muss eine Zahl sein.`);
  }
  return value;
}

function toIsoDate(value: string, key: string) {
  const date = new Date(`${value}T12:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${key} ist kein gueltiges Datum.`);
  }
  return date.toISOString();
}

function jobCostKind(formData: FormData): JobCostKind {
  const value = requiredString(formData, 'kind');
  if (
    value === 'MATERIAL_PURCHASE' ||
    value === 'MATERIAL_USED' ||
    value === 'LABOR' ||
    value === 'TRAVEL' ||
    value === 'EXTERNAL_SERVICE' ||
    value === 'FEE' ||
    value === 'OTHER'
  ) {
    return value;
  }
  throw new Error('Kostenart ist ungueltig.');
}

function jobCostUnit(formData: FormData): JobCostUnit {
  const value = requiredString(formData, 'unit');
  if (
    value === 'PIECE' ||
    value === 'HOUR' ||
    value === 'KILOMETER' ||
    value === 'KG' ||
    value === 'LITER' ||
    value === 'METER' ||
    value === 'SQUARE_METER' ||
    value === 'CUBIC_METER' ||
    value === 'FLAT_RATE' ||
    value === 'OTHER'
  ) {
    return value;
  }
  throw new Error('Kosteneinheit ist ungueltig.');
}

function redirectWith(jobId: string, values: Record<string, string | undefined>): never {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });
  redirect(params.size ? `/jobs/${jobId}?${params.toString()}` : `/jobs/${jobId}`);
}

export async function createJobCostAction(jobId: string, formData: FormData) {
  try {
    const unitCost = optionalNumber(formData, 'unitCost');
    const result = await createJobCostData(jobId, {
      itemId: optionalString(formData, 'itemId'),
      kind: jobCostKind(formData),
      description: requiredString(formData, 'description'),
      quantity: requiredNumber(formData, 'quantity'),
      unit: jobCostUnit(formData),
      unitCost,
      totalCost: unitCost === undefined ? optionalNumber(formData, 'totalCost') : undefined,
      currency: requiredString(formData, 'currency').toUpperCase(),
      taxRate: optionalNumber(formData, 'taxRate'),
      costDate: toIsoDate(requiredString(formData, 'costDate'), 'costDate'),
      vendorName: optionalString(formData, 'vendorName'),
      receiptReference: optionalString(formData, 'receiptReference'),
      notes: optionalString(formData, 'notes'),
    });
    redirectWith(jobId, result.ok ? { notice: 'cost-created' } : { error: result.error });
  } catch (error) {
    redirectWith(jobId, {
      error: error instanceof Error ? error.message : 'Kostenzeile konnte nicht erstellt werden.',
    });
  }
}

export async function updateJobCostAction(
  jobId: string,
  costLineId: string,
  formData: FormData,
) {
  try {
    const unitCost = optionalNumber(formData, 'unitCost');
    const result = await updateJobCostData(jobId, costLineId, {
      itemId: optionalNullableString(formData, 'itemId'),
      kind: jobCostKind(formData),
      description: requiredString(formData, 'description'),
      quantity: requiredNumber(formData, 'quantity'),
      unit: jobCostUnit(formData),
      unitCost: unitCost ?? null,
      totalCost: unitCost === undefined ? optionalNumber(formData, 'totalCost') : undefined,
      currency: requiredString(formData, 'currency').toUpperCase(),
      taxRate: optionalNumber(formData, 'taxRate') ?? null,
      costDate: toIsoDate(requiredString(formData, 'costDate'), 'costDate'),
      vendorName: optionalNullableString(formData, 'vendorName'),
      receiptReference: optionalNullableString(formData, 'receiptReference'),
      notes: optionalNullableString(formData, 'notes'),
    });
    redirectWith(jobId, result.ok ? { notice: 'cost-updated' } : { error: result.error });
  } catch (error) {
    redirectWith(jobId, {
      error: error instanceof Error ? error.message : 'Kostenzeile konnte nicht aktualisiert werden.',
    });
  }
}
