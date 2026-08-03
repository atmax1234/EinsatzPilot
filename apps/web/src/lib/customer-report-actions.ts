'use server';

import { parseCustomerReportStatus, parseCustomerReportType } from '@einsatzpilot/schemas';
import { redirect } from 'next/navigation';

import {
  createCustomerReportData,
  updateCustomerReportData,
  updateCustomerReportStatusData,
} from './customer-reports';

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

  const date = new Date(`${value}T12:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${key} ist kein gueltiges Datum.`);
  }

  return date.toISOString();
}

function optionalNullableIsoDate(formData: FormData, key: string) {
  return optionalIsoDate(formData, key) ?? null;
}

function selectedIds(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .filter((value): value is string => typeof value === 'string' && Boolean(value.trim()))
    .map((value) => value.trim());
}

function redirectWith(path: string, values: Record<string, string | undefined>): never {
  const params = new URLSearchParams();

  Object.entries(values).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  redirect(params.size > 0 ? `${path}?${params.toString()}` : path);
}

export async function createCustomerReportAction(jobId: string, formData: FormData) {
  let result: Awaited<ReturnType<typeof createCustomerReportData>>;

  try {
    const type = parseCustomerReportType(requiredString(formData, 'type'));
    if (!type) {
      throw new Error('Berichtstyp ist ungueltig.');
    }

    result = await createCustomerReportData({
      jobId,
      type,
      title: requiredString(formData, 'title'),
      recipientName: requiredString(formData, 'recipientName'),
      periodStart: optionalIsoDate(formData, 'periodStart'),
      periodEnd: optionalIsoDate(formData, 'periodEnd'),
      issueSummary: optionalString(formData, 'issueSummary'),
      findingSummary: optionalString(formData, 'findingSummary'),
      workPerformedSummary: optionalString(formData, 'workPerformedSummary'),
      workStillNeededSummary: optionalString(formData, 'workStillNeededSummary'),
      followUpSummary: optionalString(formData, 'followUpSummary'),
      costSummaryText: optionalString(formData, 'costSummaryText'),
      internalNotes: optionalString(formData, 'internalNotes'),
      selectedJobReportIds: selectedIds(formData, 'selectedJobReportIds'),
      selectedAttachmentIds: selectedIds(formData, 'selectedAttachmentIds'),
      selectedCostLineIds: selectedIds(formData, 'selectedCostLineIds'),
      includeFullCostSummary: formData.get('includeFullCostSummary') === 'on',
    });
  } catch (error) {
    redirectWith('/customer-reports/new', {
      jobId,
      error:
        error instanceof Error
          ? error.message
          : 'Kundenbericht konnte nicht angelegt werden.',
    });
  }

  if (!result.ok || !result.data?.customerReport) {
    redirectWith('/customer-reports/new', {
      jobId,
      error: result.error ?? 'Kundenbericht konnte nicht angelegt werden.',
    });
  }

  redirectWith(`/customer-reports/${result.data.customerReport.id}`, {
    notice: 'customer-report-created',
  });
}

export async function updateCustomerReportAction(
  customerReportId: string,
  formData: FormData,
) {
  let result: Awaited<ReturnType<typeof updateCustomerReportData>>;

  try {
    const type = parseCustomerReportType(requiredString(formData, 'type'));
    if (!type) {
      throw new Error('Berichtstyp ist ungueltig.');
    }

    result = await updateCustomerReportData(customerReportId, {
      type,
      title: requiredString(formData, 'title'),
      recipientName: requiredString(formData, 'recipientName'),
      periodStart: optionalNullableIsoDate(formData, 'periodStart'),
      periodEnd: optionalNullableIsoDate(formData, 'periodEnd'),
      issueSummary: optionalNullableString(formData, 'issueSummary'),
      findingSummary: optionalNullableString(formData, 'findingSummary'),
      workPerformedSummary: optionalNullableString(formData, 'workPerformedSummary'),
      workStillNeededSummary: optionalNullableString(formData, 'workStillNeededSummary'),
      followUpSummary: optionalNullableString(formData, 'followUpSummary'),
      costSummaryText: optionalNullableString(formData, 'costSummaryText'),
      internalNotes: optionalNullableString(formData, 'internalNotes'),
    });
  } catch (error) {
    redirectWith(`/customer-reports/${customerReportId}`, {
      error:
        error instanceof Error
          ? error.message
          : 'Kundenbericht konnte nicht aktualisiert werden.',
    });
  }

  redirectWith(
    `/customer-reports/${customerReportId}`,
    result.ok
      ? { notice: 'customer-report-updated' }
      : { error: result.error ?? 'Kundenbericht konnte nicht aktualisiert werden.' },
  );
}

export async function updateCustomerReportStatusAction(
  customerReportId: string,
  formData: FormData,
) {
  let result: Awaited<ReturnType<typeof updateCustomerReportStatusData>>;

  try {
    const status = parseCustomerReportStatus(requiredString(formData, 'status'));
    if (!status) {
      throw new Error('Berichtsstatus ist ungueltig.');
    }

    result = await updateCustomerReportStatusData(customerReportId, { status });
  } catch (error) {
    redirectWith(`/customer-reports/${customerReportId}`, {
      error:
        error instanceof Error
          ? error.message
          : 'Berichtsstatus konnte nicht aktualisiert werden.',
    });
  }

  redirectWith(
    `/customer-reports/${customerReportId}`,
    result.ok
      ? { notice: 'customer-report-status-updated' }
      : { error: result.error ?? 'Berichtsstatus konnte nicht aktualisiert werden.' },
  );
}
