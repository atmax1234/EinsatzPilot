import type {
  CustomerReportSnapshotItem,
  CustomerReportSnapshotListItem,
} from '@einsatzpilot/types';

import {
  assertCustomerReportSnapshotConsistency,
  parseCustomerReportCostBreakdown,
  parseCustomerReportSourceData,
} from './customer-report-snapshot';

type DecimalValue = { toNumber(): number };

type CustomerReportRecord = {
  id: string;
  reportNumber: string;
  jobId: string | null;
  customerId: string | null;
  addressId: string | null;
  objectId: string | null;
  objectAreaId: string | null;
  type: CustomerReportSnapshotItem['type'];
  status: CustomerReportSnapshotItem['status'];
  title: string;
  recipientName: string;
  periodStart: Date | null;
  periodEnd: Date | null;
  issueSummary: string | null;
  findingSummary: string | null;
  workPerformedSummary: string | null;
  workStillNeededSummary: string | null;
  followUpSummary: string | null;
  costSummaryText: string | null;
  internalNotes: string | null;
  snapshotCustomerName: string;
  snapshotAddressLabel: string | null;
  snapshotAddressText: string;
  snapshotObjectName: string | null;
  snapshotObjectAreaName: string | null;
  snapshotJobReference: string;
  snapshotJobTitle: string;
  snapshotCostGrandTotal: DecimalValue | null;
  snapshotCostCurrency: string | null;
  snapshotCostBreakdown: unknown;
  snapshotSourceData: unknown;
  approvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: { id: string; email: string; displayName: string | null };
  approvedBy: { id: string; email: string; displayName: string | null } | null;
};

function mapActor(user: { id: string; email: string; displayName: string | null }) {
  return {
    id: user.id,
    name: user.displayName ?? user.email,
    email: user.email,
  };
}

export function mapCustomerReportListItem(
  report: CustomerReportRecord,
): CustomerReportSnapshotListItem {
  return {
    id: report.id,
    reportNumber: report.reportNumber,
    jobId: report.jobId ?? undefined,
    customerId: report.customerId ?? undefined,
    addressId: report.addressId ?? undefined,
    objectId: report.objectId ?? undefined,
    objectAreaId: report.objectAreaId ?? undefined,
    type: report.type,
    status: report.status,
    title: report.title,
    recipientName: report.recipientName,
    periodStart: report.periodStart?.toISOString(),
    periodEnd: report.periodEnd?.toISOString(),
    snapshotCustomerName: report.snapshotCustomerName,
    snapshotAddressLabel: report.snapshotAddressLabel ?? undefined,
    snapshotAddressText: report.snapshotAddressText,
    snapshotObjectName: report.snapshotObjectName ?? undefined,
    snapshotObjectAreaName: report.snapshotObjectAreaName ?? undefined,
    snapshotJobReference: report.snapshotJobReference,
    snapshotJobTitle: report.snapshotJobTitle,
    snapshotCostGrandTotal: report.snapshotCostGrandTotal?.toNumber(),
    snapshotCostCurrency: report.snapshotCostCurrency ?? undefined,
    createdBy: mapActor(report.createdBy),
    approvedBy: report.approvedBy ? mapActor(report.approvedBy) : undefined,
    approvedAt: report.approvedAt?.toISOString(),
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
  };
}

export function mapCustomerReportDetail(
  report: CustomerReportRecord,
): CustomerReportSnapshotItem {
  const snapshotSourceData = parseCustomerReportSourceData(report.snapshotSourceData);
  const snapshotCostBreakdown =
    report.snapshotCostBreakdown == null
      ? undefined
      : parseCustomerReportCostBreakdown(report.snapshotCostBreakdown);
  assertCustomerReportSnapshotConsistency(snapshotSourceData, snapshotCostBreakdown);

  return {
    ...mapCustomerReportListItem(report),
    issueSummary: report.issueSummary ?? undefined,
    findingSummary: report.findingSummary ?? undefined,
    workPerformedSummary: report.workPerformedSummary ?? undefined,
    workStillNeededSummary: report.workStillNeededSummary ?? undefined,
    followUpSummary: report.followUpSummary ?? undefined,
    costSummaryText: report.costSummaryText ?? undefined,
    internalNotes: report.internalNotes ?? undefined,
    snapshotCostBreakdown,
    snapshotSourceData,
  };
}
