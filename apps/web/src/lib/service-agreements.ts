import type {
  RecurringObjectDutyCreateInput,
  RecurringObjectDutyUpdateInput,
  ServiceAgreementCreateInput,
  ServiceAgreementDetailResponse,
  ServiceAgreementListFilters,
  ServiceAgreementListResponse,
  ServiceAgreementOptionsResponse,
  ServiceAgreementStatus,
  ServiceAgreementStatusUpdateInput,
  ServiceAgreementUpdateInput,
} from '@einsatzpilot/types';

import { fetchApiJson } from './api';
import { getStoredSessionToken } from './server-auth';

async function token() {
  const value = await getStoredSessionToken();
  if (!value) throw new Error('Session-Token fehlt.');
  return value;
}

export function getServiceAgreementStatusLabel(status: ServiceAgreementStatus) {
  return {
    DRAFT: 'Entwurf',
    ACTIVE: 'Aktiv',
    INACTIVE: 'Inaktiv',
    ARCHIVED: 'Archiviert',
  }[status];
}

export function getServiceAgreementStatusTone(status: ServiceAgreementStatus) {
  return {
    DRAFT: '',
    ACTIVE: 'done',
    INACTIVE: 'warn',
    ARCHIVED: 'archived',
  }[status];
}

export function getCadenceLabel(unit: RecurringObjectDutyCreateInput['cadenceUnit'], interval: number) {
  const singular = {
    DAY: 'Jeden Tag',
    WEEK: 'Jede Woche',
    MONTH: 'Jeden Monat',
    YEAR: 'Jedes Jahr',
  }[unit];
  const plural = { DAY: 'Tage', WEEK: 'Wochen', MONTH: 'Monate', YEAR: 'Jahre' }[unit];
  return interval === 1 ? singular : `Alle ${interval} ${plural}`;
}

export async function getServiceAgreementsData(filters: ServiceAgreementListFilters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const query = params.size ? `?${params.toString()}` : '';
  return fetchApiJson<ServiceAgreementListResponse>(`/api/service-agreements${query}`, {
    authToken: await token(),
  });
}

export async function getServiceAgreementOptionsData() {
  return fetchApiJson<ServiceAgreementOptionsResponse>('/api/service-agreements/options', {
    authToken: await token(),
  });
}

export async function getServiceAgreementData(agreementId: string) {
  return fetchApiJson<ServiceAgreementDetailResponse>(
    `/api/service-agreements/${agreementId}`,
    { authToken: await token() },
  );
}

export async function createServiceAgreementData(input: ServiceAgreementCreateInput) {
  return fetchApiJson<ServiceAgreementDetailResponse>('/api/service-agreements', {
    authToken: await token(),
    method: 'POST',
    json: input,
  });
}

export async function updateServiceAgreementData(
  agreementId: string,
  input: ServiceAgreementUpdateInput,
) {
  return fetchApiJson<ServiceAgreementDetailResponse>(
    `/api/service-agreements/${agreementId}`,
    { authToken: await token(), method: 'PATCH', json: input },
  );
}

export async function transitionServiceAgreementData(
  agreementId: string,
  input: ServiceAgreementStatusUpdateInput,
) {
  return fetchApiJson<ServiceAgreementDetailResponse>(
    `/api/service-agreements/${agreementId}/status`,
    { authToken: await token(), method: 'PATCH', json: input },
  );
}

export async function addRecurringDutyData(
  agreementId: string,
  input: RecurringObjectDutyCreateInput,
) {
  return fetchApiJson<ServiceAgreementDetailResponse>(
    `/api/service-agreements/${agreementId}/duties`,
    { authToken: await token(), method: 'POST', json: input },
  );
}

export async function updateRecurringDutyData(
  agreementId: string,
  dutyId: string,
  input: RecurringObjectDutyUpdateInput,
) {
  return fetchApiJson<ServiceAgreementDetailResponse>(
    `/api/service-agreements/${agreementId}/duties/${dutyId}`,
    { authToken: await token(), method: 'PATCH', json: input },
  );
}
