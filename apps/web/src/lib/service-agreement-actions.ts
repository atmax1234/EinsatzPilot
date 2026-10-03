'use server';

import type {
  RecurringDutyCadenceUnit,
  RecurringObjectDutyCreateInput,
  RecurringObjectDutyUpdateInput,
  ServiceAgreementStatusUpdateInput,
} from '@einsatzpilot/types';
import { redirect } from 'next/navigation';

import {
  addRecurringDutyData,
  createServiceAgreementData,
  transitionServiceAgreementData,
  updateRecurringDutyData,
  updateServiceAgreementData,
} from './service-agreements';

function required(formData: FormData, key: string, label: string) {
  const value = formData.get(key);
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} ist erforderlich.`);
  return value.trim();
}

function optional(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function optionalNullable(formData: FormData, key: string) {
  return optional(formData, key) ?? null;
}

function cadenceUnit(formData: FormData): RecurringDutyCadenceUnit {
  const value = required(formData, 'cadenceUnit', 'Rhythmus');
  if (value === 'DAY' || value === 'WEEK' || value === 'MONTH' || value === 'YEAR') {
    return value;
  }
  throw new Error('Rhythmus ist ungültig.');
}

function interval(formData: FormData) {
  const parsed = Number(required(formData, 'cadenceInterval', 'Intervall'));
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 999) {
    throw new Error('Intervall muss eine ganze Zahl zwischen 1 und 999 sein.');
  }
  return parsed;
}

function dutyInput(formData: FormData): RecurringObjectDutyCreateInput {
  return {
    plannedText: required(formData, 'plannedText', 'Plantext'),
    notes: optional(formData, 'notes'),
    cadenceUnit: cadenceUnit(formData),
    cadenceInterval: interval(formData),
    firstDueDate: required(formData, 'firstDueDate', 'Erste Fälligkeit'),
    startTime: optional(formData, 'startTime'),
    endTime: optional(formData, 'endTime'),
    isActive: formData.get('isActive') === 'on',
  };
}

function dutyUpdateInput(formData: FormData): RecurringObjectDutyUpdateInput {
  return {
    plannedText: required(formData, 'plannedText', 'Plantext'),
    notes: optionalNullable(formData, 'notes'),
    cadenceUnit: cadenceUnit(formData),
    cadenceInterval: interval(formData),
    firstDueDate: required(formData, 'firstDueDate', 'Erste Fälligkeit'),
    startTime: optionalNullable(formData, 'startTime'),
    endTime: optionalNullable(formData, 'endTime'),
    isActive: formData.get('isActive') === 'on',
  };
}

function withQuery(path: string, values: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  return params.size ? `${path}?${params.toString()}` : path;
}

export async function createServiceAgreementAction(formData: FormData) {
  let destination: string;
  try {
    const result = await createServiceAgreementData({
      title: required(formData, 'title', 'Titel'),
      description: optional(formData, 'description'),
      effectiveFrom: required(formData, 'effectiveFrom', 'Gültig ab'),
      effectiveUntil: optional(formData, 'effectiveUntil'),
      timezone: required(formData, 'timezone', 'Zeitzone'),
      customerId: optional(formData, 'customerId'),
      addressId: optional(formData, 'addressId'),
      objectId: optional(formData, 'objectId'),
      objectAreaId: optional(formData, 'objectAreaId'),
      internalNotes: optional(formData, 'internalNotes'),
      duties: [dutyInput(formData)],
    });
    destination =
      result.ok && result.data
        ? withQuery(`/service-agreements/${result.data.serviceAgreement.id}`, {
            notice: 'agreement-created',
          })
        : withQuery('/service-agreements', {
            error: result.error ?? 'Leistungsvereinbarung konnte nicht erstellt werden.',
          });
  } catch (error) {
    destination = withQuery('/service-agreements', {
      error:
        error instanceof Error
          ? error.message
          : 'Leistungsvereinbarung konnte nicht erstellt werden.',
    });
  }
  redirect(destination);
}

export async function updateServiceAgreementAction(agreementId: string, formData: FormData) {
  let message: Record<string, string | undefined>;
  try {
    const result = await updateServiceAgreementData(agreementId, {
      title: required(formData, 'title', 'Titel'),
      description: optionalNullable(formData, 'description'),
      effectiveFrom: required(formData, 'effectiveFrom', 'Gültig ab'),
      effectiveUntil: optionalNullable(formData, 'effectiveUntil'),
      timezone: required(formData, 'timezone', 'Zeitzone'),
      customerId: optionalNullable(formData, 'customerId'),
      addressId: optionalNullable(formData, 'addressId'),
      objectId: optionalNullable(formData, 'objectId'),
      objectAreaId: optionalNullable(formData, 'objectAreaId'),
      internalNotes: optionalNullable(formData, 'internalNotes'),
    });
    message = result.ok
      ? { notice: 'agreement-updated' }
      : { error: result.error ?? 'Leistungsvereinbarung konnte nicht aktualisiert werden.' };
  } catch (error) {
    message = {
      error:
        error instanceof Error
          ? error.message
          : 'Leistungsvereinbarung konnte nicht aktualisiert werden.',
    };
  }
  redirect(withQuery(`/service-agreements/${agreementId}`, message));
}

export async function addRecurringDutyAction(agreementId: string, formData: FormData) {
  let message: Record<string, string | undefined>;
  try {
    const result = await addRecurringDutyData(agreementId, dutyInput(formData));
    message = result.ok
      ? { notice: 'duty-created' }
      : { error: result.error ?? 'Pflicht konnte nicht erstellt werden.' };
  } catch (error) {
    message = {
      error: error instanceof Error ? error.message : 'Pflicht konnte nicht erstellt werden.',
    };
  }
  redirect(withQuery(`/service-agreements/${agreementId}`, message));
}

export async function updateRecurringDutyAction(
  agreementId: string,
  dutyId: string,
  formData: FormData,
) {
  let message: Record<string, string | undefined>;
  try {
    const result = await updateRecurringDutyData(agreementId, dutyId, dutyUpdateInput(formData));
    message = result.ok
      ? { notice: 'duty-updated' }
      : { error: result.error ?? 'Pflicht konnte nicht aktualisiert werden.' };
  } catch (error) {
    message = {
      error: error instanceof Error ? error.message : 'Pflicht konnte nicht aktualisiert werden.',
    };
  }
  redirect(withQuery(`/service-agreements/${agreementId}`, message));
}

export async function transitionServiceAgreementAction(
  agreementId: string,
  status: ServiceAgreementStatusUpdateInput['status'],
) {
  const notices = {
    ACTIVE: 'agreement-activated',
    INACTIVE: 'agreement-deactivated',
    ARCHIVED: 'agreement-archived',
  } as const;
  let message: Record<string, string | undefined>;
  try {
    const result = await transitionServiceAgreementData(agreementId, { status });
    message = result.ok
      ? { notice: notices[status] }
      : { error: result.error ?? 'Status konnte nicht geändert werden.' };
  } catch (error) {
    message = {
      error: error instanceof Error ? error.message : 'Status konnte nicht geändert werden.',
    };
  }
  redirect(withQuery(`/service-agreements/${agreementId}`, message));
}
