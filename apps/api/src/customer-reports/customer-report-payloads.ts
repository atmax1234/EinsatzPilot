import { BadRequestException } from '@nestjs/common';

import { customerReportStatuses, customerReportTypes } from '@einsatzpilot/schemas';
import type {
  CustomerReportCreateInput,
  CustomerReportStatus,
  CustomerReportStatusUpdateInput,
  CustomerReportType,
  CustomerReportUpdateInput,
} from '@einsatzpilot/types';

const createFields = new Set([
  'jobId',
  'type',
  'title',
  'recipientName',
  'periodStart',
  'periodEnd',
  'issueSummary',
  'findingSummary',
  'workPerformedSummary',
  'workStillNeededSummary',
  'followUpSummary',
  'costSummaryText',
  'internalNotes',
  'selectedJobReportIds',
  'selectedAttachmentIds',
  'selectedCostLineIds',
  'includeFullCostSummary',
]);

const updateFields = new Set([
  'type',
  'title',
  'recipientName',
  'periodStart',
  'periodEnd',
  'issueSummary',
  'findingSummary',
  'workPerformedSummary',
  'workStillNeededSummary',
  'followUpSummary',
  'costSummaryText',
  'internalNotes',
]);

function assertPayloadObject(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new BadRequestException('Payload muss ein JSON-Objekt sein.');
  }
}

function assertKnownFields(value: object, allowed: Set<string>) {
  const unknown = Object.keys(value).filter((key) => !allowed.has(key));
  if (unknown.length) {
    throw new BadRequestException(`Unbekannte oder nicht aenderbare Felder: ${unknown.join(', ')}.`);
  }
}

function requiredText(value: unknown, field: string, maxLength: number) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new BadRequestException(`${field} ist erforderlich.`);
  }

  const normalized = value.trim();
  if (normalized.length > maxLength) {
    throw new BadRequestException(`${field} darf hoechstens ${maxLength} Zeichen enthalten.`);
  }

  return normalized;
}

function optionalText(value: unknown, field: string, maxLength: number) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new BadRequestException(`${field} muss Text sein.`);
  }

  const normalized = value.trim();
  if (normalized.length > maxLength) {
    throw new BadRequestException(`${field} darf hoechstens ${maxLength} Zeichen enthalten.`);
  }

  return normalized || undefined;
}

function optionalNullableText(value: unknown, field: string, maxLength: number) {
  if (value === null) {
    return null;
  }

  const normalized = optionalText(value, field, maxLength);
  return normalized === undefined && value !== undefined ? null : normalized;
}

function enumValue<T extends string>(value: unknown, allowed: readonly T[], field: string): T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    throw new BadRequestException(`${field} ist ungueltig.`);
  }

  return value as T;
}

function optionalDate(value: unknown, field: string) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string' || !value.trim()) {
    throw new BadRequestException(`${field} muss ein gueltiges ISO-Datum sein.`);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(`${field} muss ein gueltiges ISO-Datum sein.`);
  }

  return date;
}

function optionalNullableDate(value: unknown, field: string) {
  if (value === null || value === '') {
    return null;
  }

  return optionalDate(value, field);
}

function assertPeriodOrder(periodStart?: Date | null, periodEnd?: Date | null) {
  if (periodStart && periodEnd && periodEnd.getTime() < periodStart.getTime()) {
    throw new BadRequestException('periodEnd darf nicht vor periodStart liegen.');
  }
}

function selectedIds(value: unknown, field: string) {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value) || value.length > 100) {
    throw new BadRequestException(`${field} muss ein Array mit hoechstens 100 IDs sein.`);
  }

  const ids = value.map((id) => requiredText(id, field, 191));
  if (new Set(ids).size !== ids.length) {
    throw new BadRequestException(`${field} darf keine doppelten IDs enthalten.`);
  }

  return ids;
}

function includeFullCostSummary(value: unknown) {
  if (value === undefined) {
    return false;
  }

  if (typeof value !== 'boolean') {
    throw new BadRequestException('includeFullCostSummary muss ein Boolean sein.');
  }

  return value;
}

export function normalizeCustomerReportCreateInput(input: CustomerReportCreateInput) {
  assertPayloadObject(input);
  assertKnownFields(input, createFields);

  const periodStart = optionalDate(input.periodStart, 'periodStart');
  const periodEnd = optionalDate(input.periodEnd, 'periodEnd');
  assertPeriodOrder(periodStart, periodEnd);

  return {
    jobId: requiredText(input.jobId, 'jobId', 191),
    type: enumValue<CustomerReportType>(input.type, customerReportTypes, 'type'),
    title: requiredText(input.title, 'title', 240),
    recipientName: requiredText(input.recipientName, 'recipientName', 200),
    periodStart,
    periodEnd,
    issueSummary: optionalText(input.issueSummary, 'issueSummary', 10_000),
    findingSummary: optionalText(input.findingSummary, 'findingSummary', 10_000),
    workPerformedSummary: optionalText(
      input.workPerformedSummary,
      'workPerformedSummary',
      10_000,
    ),
    workStillNeededSummary: optionalText(
      input.workStillNeededSummary,
      'workStillNeededSummary',
      10_000,
    ),
    followUpSummary: optionalText(input.followUpSummary, 'followUpSummary', 10_000),
    costSummaryText: optionalText(input.costSummaryText, 'costSummaryText', 10_000),
    internalNotes: optionalText(input.internalNotes, 'internalNotes', 20_000),
    selectedJobReportIds: selectedIds(
      input.selectedJobReportIds,
      'selectedJobReportIds',
    ),
    selectedAttachmentIds: selectedIds(
      input.selectedAttachmentIds,
      'selectedAttachmentIds',
    ),
    selectedCostLineIds: selectedIds(input.selectedCostLineIds, 'selectedCostLineIds'),
    includeFullCostSummary: includeFullCostSummary(input.includeFullCostSummary),
  };
}

export function normalizeCustomerReportUpdateInput(input: CustomerReportUpdateInput) {
  assertPayloadObject(input);
  assertKnownFields(input, updateFields);

  const payload = {
    type:
      input.type === undefined
        ? undefined
        : enumValue<CustomerReportType>(input.type, customerReportTypes, 'type'),
    title:
      input.title === undefined ? undefined : requiredText(input.title, 'title', 240),
    recipientName:
      input.recipientName === undefined
        ? undefined
        : requiredText(input.recipientName, 'recipientName', 200),
    periodStart: optionalNullableDate(input.periodStart, 'periodStart'),
    periodEnd: optionalNullableDate(input.periodEnd, 'periodEnd'),
    issueSummary: optionalNullableText(input.issueSummary, 'issueSummary', 10_000),
    findingSummary: optionalNullableText(input.findingSummary, 'findingSummary', 10_000),
    workPerformedSummary: optionalNullableText(
      input.workPerformedSummary,
      'workPerformedSummary',
      10_000,
    ),
    workStillNeededSummary: optionalNullableText(
      input.workStillNeededSummary,
      'workStillNeededSummary',
      10_000,
    ),
    followUpSummary: optionalNullableText(input.followUpSummary, 'followUpSummary', 10_000),
    costSummaryText: optionalNullableText(input.costSummaryText, 'costSummaryText', 10_000),
    internalNotes: optionalNullableText(input.internalNotes, 'internalNotes', 20_000),
  };

  if (Object.values(payload).every((value) => value === undefined)) {
    throw new BadRequestException('Mindestens ein Kundenberichtsfeld muss aktualisiert werden.');
  }

  return payload;
}

export function assertCustomerReportUpdatePeriod(input: {
  periodStart?: Date | null;
  periodEnd?: Date | null;
}) {
  assertPeriodOrder(input.periodStart, input.periodEnd);
}

export function normalizeCustomerReportStatusInput(input: CustomerReportStatusUpdateInput) {
  assertPayloadObject(input);
  assertKnownFields(input, new Set(['status']));

  return {
    status: enumValue<CustomerReportStatus>(
      input.status,
      customerReportStatuses,
      'status',
    ),
  };
}
