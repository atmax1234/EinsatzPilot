import type {
  JobCostCreateInput,
  JobCostKind,
  JobCostLineItem,
  JobCostListResponse,
  JobCostUnit,
  JobCostUpdateInput,
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

export function getJobCostKindLabel(kind: JobCostKind) {
  return {
    MATERIAL_PURCHASE: 'Materialeinkauf',
    MATERIAL_USED: 'Materialverbrauch',
    LABOR: 'Arbeitszeit',
    TRAVEL: 'Fahrtkosten',
    EXTERNAL_SERVICE: 'Fremdleistung',
    FEE: 'Gebuehr',
    OTHER: 'Sonstige Kosten',
  }[kind];
}

export function getJobCostUnitLabel(unit: JobCostUnit) {
  return {
    PIECE: 'Stueck',
    HOUR: 'Stunde',
    KILOMETER: 'Kilometer',
    KG: 'kg',
    LITER: 'Liter',
    METER: 'Meter',
    SQUARE_METER: 'Quadratmeter',
    CUBIC_METER: 'Kubikmeter',
    FLAT_RATE: 'Pauschal',
    OTHER: 'Andere Einheit',
  }[unit];
}

export function formatJobCostMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatJobCostDate(value: string) {
  return new Intl.DateTimeFormat('de-DE').format(new Date(value));
}

export function toDateInputValue(value?: string) {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

export async function getJobCostsData(jobId: string) {
  const token = await getAuthTokenOrThrow();
  return fetchApiJson<JobCostListResponse>(`/api/jobs/${jobId}/costs`, {
    authToken: token,
  });
}

export async function createJobCostData(jobId: string, input: JobCostCreateInput) {
  const token = await getAuthTokenOrThrow();
  return fetchApiJson<JobCostLineItem>(`/api/jobs/${jobId}/costs`, {
    authToken: token,
    method: 'POST',
    json: input,
  });
}

export async function updateJobCostData(
  jobId: string,
  costLineId: string,
  input: JobCostUpdateInput,
) {
  const token = await getAuthTokenOrThrow();
  return fetchApiJson<JobCostLineItem>(`/api/jobs/${jobId}/costs/${costLineId}`, {
    authToken: token,
    method: 'PATCH',
    json: input,
  });
}
