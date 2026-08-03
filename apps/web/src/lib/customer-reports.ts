import type {
  CustomerReportCreateInput,
  CustomerReportDetailResponse,
  CustomerReportListResponse,
  CustomerReportSourceDataResponse,
  CustomerReportStatus,
  CustomerReportStatusUpdateInput,
  CustomerReportType,
  CustomerReportUpdateInput,
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

export function getCustomerReportTypeLabel(type: CustomerReportType) {
  return {
    JOB_COMPLETION: 'Auftragsabschluss',
    INCIDENT: 'Stoerungsbericht',
    DAMAGE_REPORT: 'Schadensbericht',
    MAINTENANCE: 'Wartungsbericht',
    OBJECT_STATUS: 'Objektstatus',
    COST_OVERVIEW: 'Kostenuebersicht',
    OTHER: 'Sonstiger Kundenbericht',
  }[type];
}

export function getCustomerReportStatusLabel(status: CustomerReportStatus) {
  return {
    DRAFT: 'Entwurf',
    READY_FOR_REVIEW: 'Zur Pruefung bereit',
    APPROVED: 'Freigegeben',
    ARCHIVED: 'Archiviert',
  }[status];
}

export function getCustomerReportStatusTone(status: CustomerReportStatus) {
  return {
    DRAFT: 'neutral',
    READY_FOR_REVIEW: 'accent',
    APPROVED: 'done',
    ARCHIVED: 'warn',
  }[status];
}

export function formatCustomerReportDate(value?: string) {
  if (!value) {
    return 'Nicht gesetzt';
  }

  return new Intl.DateTimeFormat('de-DE').format(new Date(value));
}

export function toCustomerReportDateInput(value?: string) {
  return value ? new Date(value).toISOString().slice(0, 10) : '';
}

export async function getCustomerReportsData(jobId?: string) {
  const token = await getAuthTokenOrThrow();
  const searchParams = new URLSearchParams();

  if (jobId) {
    searchParams.set('jobId', jobId);
  }

  const query = searchParams.size > 0 ? `?${searchParams.toString()}` : '';
  return fetchApiJson<CustomerReportListResponse>(`/api/customer-reports${query}`, {
    authToken: token,
  });
}

export async function getCustomerReportData(customerReportId: string) {
  const token = await getAuthTokenOrThrow();
  return fetchApiJson<CustomerReportDetailResponse>(
    `/api/customer-reports/${customerReportId}`,
    { authToken: token },
  );
}

export async function getCustomerReportSourceData(jobId: string) {
  const token = await getAuthTokenOrThrow();
  return fetchApiJson<CustomerReportSourceDataResponse>(
    `/api/jobs/${jobId}/customer-report-source-data`,
    { authToken: token },
  );
}

export async function createCustomerReportData(input: CustomerReportCreateInput) {
  const token = await getAuthTokenOrThrow();
  return fetchApiJson<CustomerReportDetailResponse>('/api/customer-reports', {
    authToken: token,
    method: 'POST',
    json: input,
  });
}

export async function updateCustomerReportData(
  customerReportId: string,
  input: CustomerReportUpdateInput,
) {
  const token = await getAuthTokenOrThrow();
  return fetchApiJson<CustomerReportDetailResponse>(
    `/api/customer-reports/${customerReportId}`,
    {
      authToken: token,
      method: 'PATCH',
      json: input,
    },
  );
}

export async function updateCustomerReportStatusData(
  customerReportId: string,
  input: CustomerReportStatusUpdateInput,
) {
  const token = await getAuthTokenOrThrow();
  return fetchApiJson<CustomerReportDetailResponse>(
    `/api/customer-reports/${customerReportId}/status`,
    {
      authToken: token,
      method: 'PATCH',
      json: input,
    },
  );
}
