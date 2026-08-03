import { InternalServerErrorException } from '@nestjs/common';

import {
  attachmentKinds,
  customerTypes,
  jobCostKinds,
  jobCostUnits,
  jobPriorities,
  jobReportTypes,
  jobStatuses,
  objectAreaTypes,
  objectStatuses,
  objectTypes,
  reportReviewStatuses,
} from '@einsatzpilot/schemas';
import type {
  CustomerReportAddressSourceSnapshot,
  CustomerReportAttachmentSourceSnapshot,
  CustomerReportCostBreakdown,
  CustomerReportCostLineSnapshot,
  CustomerReportCustomerSourceSnapshot,
  CustomerReportJobReportSourceSnapshot,
  CustomerReportJobSourceSnapshot,
  CustomerReportObjectAreaSourceSnapshot,
  CustomerReportObjectSourceSnapshot,
  CustomerReportSourceData,
  JobCostLineItem,
  JobCostSummary,
  JobPriority,
  JobReportItem,
  JobStatus,
} from '@einsatzpilot/types';

type DecimalValue = { toNumber(): number };

function actor(user?: { id: string; email: string; displayName: string | null } | null) {
  return user
    ? {
        id: user.id,
        name: user.displayName ?? user.email,
        email: user.email,
      }
    : undefined;
}

export function mapCustomerReportJobSource(job: {
  id: string;
  reference: string;
  title: string;
  description: string | null;
  customerName: string;
  location: string;
  scheduledStart: Date;
  scheduledEnd: Date | null;
  status: JobStatus;
  priority: JobPriority;
  updatedAt: Date;
}): CustomerReportJobSourceSnapshot {
  return {
    id: job.id,
    reference: job.reference,
    title: job.title,
    description: job.description ?? undefined,
    customerName: job.customerName,
    location: job.location,
    scheduledStart: job.scheduledStart.toISOString(),
    scheduledEnd: job.scheduledEnd?.toISOString(),
    status: job.status,
    priority: job.priority,
    updatedAt: job.updatedAt.toISOString(),
  };
}

export function mapCustomerReportCustomerSource(customer?: {
  id: string;
  name: string;
  type: CustomerReportCustomerSourceSnapshot['type'];
  email: string | null;
  phone: string | null;
  updatedAt: Date;
} | null): CustomerReportCustomerSourceSnapshot | undefined {
  return customer
    ? {
        id: customer.id,
        name: customer.name,
        type: customer.type,
        email: customer.email ?? undefined,
        phone: customer.phone ?? undefined,
        updatedAt: customer.updatedAt.toISOString(),
      }
    : undefined;
}

export function mapCustomerReportAddressSource(address?: {
  id: string;
  label: string;
  street: string;
  postalCode: string;
  city: string;
  country: string;
  updatedAt: Date;
} | null): CustomerReportAddressSourceSnapshot | undefined {
  return address
    ? {
        id: address.id,
        label: address.label,
        street: address.street,
        postalCode: address.postalCode,
        city: address.city,
        country: address.country,
        updatedAt: address.updatedAt.toISOString(),
      }
    : undefined;
}

export function mapCustomerReportObjectSource(object?: {
  id: string;
  name: string;
  type: CustomerReportObjectSourceSnapshot['type'];
  status: CustomerReportObjectSourceSnapshot['status'];
  updatedAt: Date;
} | null): CustomerReportObjectSourceSnapshot | undefined {
  return object
    ? {
        id: object.id,
        name: object.name,
        type: object.type,
        status: object.status,
        updatedAt: object.updatedAt.toISOString(),
      }
    : undefined;
}

export function mapCustomerReportObjectAreaSource(objectArea?: {
  id: string;
  objectId: string;
  name: string;
  type: CustomerReportObjectAreaSourceSnapshot['type'];
  updatedAt: Date;
} | null): CustomerReportObjectAreaSourceSnapshot | undefined {
  return objectArea
    ? {
        id: objectArea.id,
        objectId: objectArea.objectId,
        name: objectArea.name,
        type: objectArea.type,
        updatedAt: objectArea.updatedAt.toISOString(),
      }
    : undefined;
}

export function mapCustomerReportJobReportSource(
  report: {
    id: string;
    type: JobReportItem['type'];
    summary: string;
    details: string | null;
    findingSummary: string | null;
    workPerformed: string | null;
    workStillNeeded: string | null;
    followUpRequired: boolean;
    followUpNotes: string | null;
    reviewStatus: JobReportItem['reviewStatus'];
    reviewedAt: Date | null;
    author?: { id: string; email: string; displayName: string | null } | null;
    reviewer?: { id: string; email: string; displayName: string | null } | null;
    team?: { id: string; name: string } | null;
    createdAt: Date;
    updatedAt: Date;
  },
  position: number,
): CustomerReportJobReportSourceSnapshot {
  return {
    id: report.id,
    position,
    type: report.type,
    summary: report.summary,
    details: report.details ?? undefined,
    findingSummary: report.findingSummary ?? undefined,
    workPerformed: report.workPerformed ?? undefined,
    workStillNeeded: report.workStillNeeded ?? undefined,
    followUpRequired: report.followUpRequired,
    followUpNotes: report.followUpNotes ?? undefined,
    reviewStatus: report.reviewStatus,
    reviewedAt: report.reviewedAt?.toISOString(),
    author: actor(report.author),
    reviewedBy: actor(report.reviewer),
    team: report.team ?? undefined,
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
  };
}

export function mapCustomerReportAttachmentSource(
  attachment: {
    id: string;
    reportId: string | null;
    kind: CustomerReportAttachmentSourceSnapshot['kind'];
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    caption: string | null;
    createdAt: Date;
    updatedAt: Date;
  },
  position: number,
): CustomerReportAttachmentSourceSnapshot {
  return {
    id: attachment.id,
    position,
    reportId: attachment.reportId ?? undefined,
    kind: attachment.kind,
    fileName: attachment.fileName,
    mimeType: attachment.mimeType,
    sizeBytes: attachment.sizeBytes,
    caption: attachment.caption ?? undefined,
    uploadedAt: attachment.createdAt.toISOString(),
    updatedAt: attachment.updatedAt.toISOString(),
  };
}

export function mapCustomerReportCostLineSnapshot(
  costLine: {
    id: string;
    kind: JobCostLineItem['kind'];
    description: string;
    quantity: DecimalValue;
    unit: JobCostLineItem['unit'];
    unitCost: DecimalValue | null;
    totalCost: DecimalValue;
    currency: string;
    taxRate: DecimalValue | null;
    costDate: Date;
    vendorName: string | null;
    receiptReference: string | null;
    notes: string | null;
    item?: { id: string; customId: string; name: string } | null;
    updatedAt: Date;
  },
  position: number,
): CustomerReportCostLineSnapshot {
  return {
    sourceCostLineId: costLine.id,
    position,
    kind: costLine.kind,
    description: costLine.description,
    quantity: costLine.quantity.toNumber(),
    unit: costLine.unit,
    unitCost: costLine.unitCost?.toNumber(),
    totalCost: costLine.totalCost.toNumber(),
    currency: costLine.currency,
    taxRate: costLine.taxRate?.toNumber(),
    costDate: costLine.costDate.toISOString(),
    vendorName: costLine.vendorName ?? undefined,
    receiptReference: costLine.receiptReference ?? undefined,
    notes: costLine.notes ?? undefined,
    item: costLine.item ?? undefined,
    sourceUpdatedAt: costLine.updatedAt.toISOString(),
  };
}

export function formatSnapshotAddress(
  address: CustomerReportAddressSourceSnapshot | undefined,
  fallbackLocation: string,
) {
  if (!address) {
    return fallbackLocation;
  }

  return `${address.street}, ${address.postalCode} ${address.city}, ${address.country}`;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && Boolean(value.trim());
}

function isOptionalString(value: unknown) {
  return value === undefined || typeof value === 'string';
}

function isOptionalNonEmptyString(value: unknown) {
  return value === undefined || isNonEmptyString(value);
}

function isCanonicalIsoDate(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }

  const timestamp = Date.parse(value);
  return !Number.isNaN(timestamp) && new Date(timestamp).toISOString() === value;
}

function isOptionalIsoDate(value: unknown) {
  return value === undefined || isCanonicalIsoDate(value);
}

function isEnumValue<T extends string>(value: unknown, values: readonly T[]): value is T {
  return typeof value === 'string' && values.includes(value as T);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isNonNegativeNumber(value: unknown): value is number {
  return isFiniteNumber(value) && value >= 0;
}

function isOptionalNonNegativeNumber(value: unknown) {
  return value === undefined || isNonNegativeNumber(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}

function isCurrency(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Z]{3}$/.test(value);
}

function isUniqueStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every(isNonEmptyString) &&
    new Set(value).size === value.length
  );
}

function isActor(value: unknown) {
  return (
    isObject(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.name) &&
    isNonEmptyString(value.email)
  );
}

function isOptionalActor(value: unknown) {
  return value === undefined || isActor(value);
}

function isTeam(value: unknown) {
  return (
    isObject(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.name)
  );
}

function isOptionalTeam(value: unknown) {
  return value === undefined || isTeam(value);
}

function isJobSource(value: unknown): value is CustomerReportJobSourceSnapshot {
  return (
    isObject(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.reference) &&
    isNonEmptyString(value.title) &&
    isOptionalString(value.description) &&
    isNonEmptyString(value.customerName) &&
    isNonEmptyString(value.location) &&
    isCanonicalIsoDate(value.scheduledStart) &&
    isOptionalIsoDate(value.scheduledEnd) &&
    isEnumValue(value.status, jobStatuses) &&
    isEnumValue(value.priority, jobPriorities) &&
    isCanonicalIsoDate(value.updatedAt)
  );
}

function isCustomerSource(value: unknown): value is CustomerReportCustomerSourceSnapshot {
  return (
    isObject(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.name) &&
    isEnumValue(value.type, customerTypes) &&
    isOptionalString(value.email) &&
    isOptionalString(value.phone) &&
    isCanonicalIsoDate(value.updatedAt)
  );
}

function isAddressSource(value: unknown): value is CustomerReportAddressSourceSnapshot {
  return (
    isObject(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.label) &&
    isNonEmptyString(value.street) &&
    isNonEmptyString(value.postalCode) &&
    isNonEmptyString(value.city) &&
    isNonEmptyString(value.country) &&
    isCanonicalIsoDate(value.updatedAt)
  );
}

function isObjectSource(value: unknown): value is CustomerReportObjectSourceSnapshot {
  return (
    isObject(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.name) &&
    isEnumValue(value.type, objectTypes) &&
    isEnumValue(value.status, objectStatuses) &&
    isCanonicalIsoDate(value.updatedAt)
  );
}

function isObjectAreaSource(
  value: unknown,
): value is CustomerReportObjectAreaSourceSnapshot {
  return (
    isObject(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.objectId) &&
    isNonEmptyString(value.name) &&
    isEnumValue(value.type, objectAreaTypes) &&
    isCanonicalIsoDate(value.updatedAt)
  );
}

function isJobReportSource(
  value: unknown,
): value is CustomerReportJobReportSourceSnapshot {
  return (
    isObject(value) &&
    isNonEmptyString(value.id) &&
    isNonNegativeInteger(value.position) &&
    isEnumValue(value.type, jobReportTypes) &&
    isNonEmptyString(value.summary) &&
    isOptionalString(value.details) &&
    isOptionalString(value.findingSummary) &&
    isOptionalString(value.workPerformed) &&
    isOptionalString(value.workStillNeeded) &&
    typeof value.followUpRequired === 'boolean' &&
    isOptionalString(value.followUpNotes) &&
    isEnumValue(value.reviewStatus, reportReviewStatuses) &&
    isOptionalIsoDate(value.reviewedAt) &&
    isOptionalActor(value.author) &&
    isOptionalActor(value.reviewedBy) &&
    isOptionalTeam(value.team) &&
    isCanonicalIsoDate(value.createdAt) &&
    isCanonicalIsoDate(value.updatedAt)
  );
}

function isAttachmentSource(
  value: unknown,
): value is CustomerReportAttachmentSourceSnapshot {
  return (
    isObject(value) &&
    isNonEmptyString(value.id) &&
    isNonNegativeInteger(value.position) &&
    isOptionalNonEmptyString(value.reportId) &&
    isEnumValue(value.kind, attachmentKinds) &&
    isNonEmptyString(value.fileName) &&
    isNonEmptyString(value.mimeType) &&
    isNonNegativeInteger(value.sizeBytes) &&
    isOptionalString(value.caption) &&
    isCanonicalIsoDate(value.uploadedAt) &&
    isCanonicalIsoDate(value.updatedAt)
  );
}

function hasOrderedIds<T extends { id: string; position: number }>(
  selectedIds: string[],
  records: T[],
) {
  return (
    selectedIds.length === records.length &&
    records.every(
      (record, index) => record.position === index && record.id === selectedIds[index],
    )
  );
}

function isJobCostSummary(value: unknown): value is JobCostSummary {
  if (
    !isObject(value) ||
    !isNonNegativeNumber(value.materialTotal) ||
    !isNonNegativeNumber(value.laborTotal) ||
    !isNonNegativeNumber(value.travelTotal) ||
    !isNonNegativeNumber(value.externalServiceTotal) ||
    !isNonNegativeNumber(value.otherTotal) ||
    !isNonNegativeNumber(value.grandTotal) ||
    !isCurrency(value.currency) ||
    !isNonNegativeInteger(value.lineCount)
  ) {
    return false;
  }

  const groupedTotal =
    value.materialTotal +
    value.laborTotal +
    value.travelTotal +
    value.externalServiceTotal +
    value.otherTotal;
  return (
    moneyEquals(groupedTotal, value.grandTotal) &&
    (value.lineCount > 0 || moneyEquals(value.grandTotal, 0))
  );
}

function isCostLine(value: unknown): value is CustomerReportCostLineSnapshot {
  return (
    isObject(value) &&
    isNonEmptyString(value.sourceCostLineId) &&
    isNonNegativeInteger(value.position) &&
    isEnumValue(value.kind, jobCostKinds) &&
    isNonEmptyString(value.description) &&
    isFiniteNumber(value.quantity) &&
    value.quantity > 0 &&
    isEnumValue(value.unit, jobCostUnits) &&
    isOptionalNonNegativeNumber(value.unitCost) &&
    isNonNegativeNumber(value.totalCost) &&
    isCurrency(value.currency) &&
    isOptionalNonNegativeNumber(value.taxRate) &&
    (value.taxRate === undefined || value.taxRate <= 100) &&
    isCanonicalIsoDate(value.costDate) &&
    isOptionalString(value.vendorName) &&
    isOptionalString(value.receiptReference) &&
    isOptionalString(value.notes) &&
    (value.item === undefined ||
      (isObject(value.item) &&
        isNonEmptyString(value.item.id) &&
        isNonEmptyString(value.item.customId) &&
        isNonEmptyString(value.item.name))) &&
    isCanonicalIsoDate(value.sourceUpdatedAt)
  );
}

function moneyEquals(left: number, right: number) {
  return Math.abs(left - right) < 0.005;
}

function selectedLineSummaryMatches(
  summary: JobCostSummary,
  lines: CustomerReportCostLineSnapshot[],
) {
  const totals = {
    materialTotal: 0,
    laborTotal: 0,
    travelTotal: 0,
    externalServiceTotal: 0,
    otherTotal: 0,
  };

  lines.forEach((line) => {
    if (line.kind === 'MATERIAL_PURCHASE' || line.kind === 'MATERIAL_USED') {
      totals.materialTotal += line.totalCost;
    } else if (line.kind === 'LABOR') {
      totals.laborTotal += line.totalCost;
    } else if (line.kind === 'TRAVEL') {
      totals.travelTotal += line.totalCost;
    } else if (line.kind === 'EXTERNAL_SERVICE') {
      totals.externalServiceTotal += line.totalCost;
    } else {
      totals.otherTotal += line.totalCost;
    }
  });

  return (
    summary.lineCount === lines.length &&
    lines.every((line) => line.currency === summary.currency) &&
    moneyEquals(summary.materialTotal, totals.materialTotal) &&
    moneyEquals(summary.laborTotal, totals.laborTotal) &&
    moneyEquals(summary.travelTotal, totals.travelTotal) &&
    moneyEquals(summary.externalServiceTotal, totals.externalServiceTotal) &&
    moneyEquals(summary.otherTotal, totals.otherTotal)
  );
}

export function parseCustomerReportSourceData(value: unknown): CustomerReportSourceData {
  const jobReports = isObject(value) && Array.isArray(value.jobReports)
    ? value.jobReports
    : undefined;
  const attachments = isObject(value) && Array.isArray(value.attachments)
    ? value.attachments
    : undefined;

  if (
    !isObject(value) ||
    value.schemaVersion !== 1 ||
    !isCanonicalIsoDate(value.capturedAt) ||
    !isJobSource(value.job) ||
    (value.customer !== undefined && !isCustomerSource(value.customer)) ||
    (value.address !== undefined && !isAddressSource(value.address)) ||
    (value.object !== undefined && !isObjectSource(value.object)) ||
    (value.objectArea !== undefined && !isObjectAreaSource(value.objectArea)) ||
    (isObjectAreaSource(value.objectArea) &&
      (!isObjectSource(value.object) || value.objectArea.objectId !== value.object.id)) ||
    !isUniqueStringArray(value.selectedJobReportIds) ||
    !isUniqueStringArray(value.selectedAttachmentIds) ||
    !isUniqueStringArray(value.selectedCostLineIds) ||
    typeof value.includeFullCostSummary !== 'boolean' ||
    !jobReports ||
    !jobReports.every(isJobReportSource) ||
    jobReports.some((report) => report.reviewStatus !== 'APPROVED') ||
    !attachments ||
    !attachments.every(isAttachmentSource) ||
    !hasOrderedIds(value.selectedJobReportIds, jobReports) ||
    !hasOrderedIds(value.selectedAttachmentIds, attachments)
  ) {
    throw new InternalServerErrorException(
      'Gespeicherte Quellen des Kundenberichts sind ungueltig.',
    );
  }

  return value as CustomerReportSourceData;
}

export function parseCustomerReportCostBreakdown(
  value: unknown,
): CustomerReportCostBreakdown {
  const selectedLines = isObject(value) && Array.isArray(value.selectedLines)
    ? value.selectedLines
    : undefined;

  if (
    !isObject(value) ||
    value.schemaVersion !== 1 ||
    !isCanonicalIsoDate(value.capturedAt) ||
    typeof value.includeFullCostSummary !== 'boolean' ||
    !isJobCostSummary(value.selectedLineSummary) ||
    !selectedLines ||
    !selectedLines.every(isCostLine) ||
    selectedLines.some((line, index) => line.position !== index) ||
    new Set(selectedLines.map((line) => line.sourceCostLineId)).size !==
      selectedLines.length ||
    !selectedLineSummaryMatches(value.selectedLineSummary, selectedLines) ||
    (value.fullJobSummary !== undefined && !isJobCostSummary(value.fullJobSummary)) ||
    value.includeFullCostSummary !== (value.fullJobSummary !== undefined)
  ) {
    throw new InternalServerErrorException(
      'Gespeicherte Kostenaufschluesselung des Kundenberichts ist ungueltig.',
    );
  }

  return value as CustomerReportCostBreakdown;
}

export function assertCustomerReportSnapshotConsistency(
  sources: CustomerReportSourceData,
  costs?: CustomerReportCostBreakdown,
) {
  const selectedCostLineIds = costs?.selectedLines.map(
    (line) => line.sourceCostLineId,
  );
  const costsMatchSources = costs
    ? costs.capturedAt === sources.capturedAt &&
      costs.includeFullCostSummary === sources.includeFullCostSummary &&
      selectedCostLineIds?.length === sources.selectedCostLineIds.length &&
      selectedCostLineIds.every(
        (costLineId, index) => costLineId === sources.selectedCostLineIds[index],
      )
    : sources.selectedCostLineIds.length === 0 && !sources.includeFullCostSummary;

  if (!costsMatchSources) {
    throw new InternalServerErrorException(
      'Gespeicherte Quellen und Kosten des Kundenberichts sind inkonsistent.',
    );
  }
}
