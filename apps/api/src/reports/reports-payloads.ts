import { BadRequestException } from '@nestjs/common';

import {
  jobReportTypes,
  reportReviewDecisionStatuses,
} from '@einsatzpilot/schemas';
import type {
  JobReportCreateInput,
  JobReportReviewInput,
  JobReportType,
  ReportReviewDecisionStatus,
} from '@einsatzpilot/types';

function ensureNonEmptyString(value: unknown, fieldName: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new BadRequestException(`${fieldName} ist erforderlich.`);
  }

  return value.trim();
}

function ensureOptionalString(value: unknown) {
  if (value == null) {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new BadRequestException('Ungueltiger Textwert im Payload.');
  }

  const trimmed = value.trim();
  return trimmed || undefined;
}

function ensureJobReportType(value: unknown): JobReportType {
  if (value === undefined) {
    return 'GENERAL';
  }

  if (typeof value !== 'string' || !jobReportTypes.includes(value as JobReportType)) {
    throw new BadRequestException('type ist ungueltig.');
  }

  return value as JobReportType;
}

function ensureFollowUpRequired(value: unknown) {
  if (value === undefined) {
    return false;
  }

  if (typeof value !== 'boolean') {
    throw new BadRequestException('followUpRequired muss ein Boolean sein.');
  }

  return value;
}

function ensureReviewDecisionStatus(value: unknown): ReportReviewDecisionStatus {
  if (
    typeof value !== 'string' ||
    !reportReviewDecisionStatuses.includes(value as ReportReviewDecisionStatus)
  ) {
    throw new BadRequestException(
      'reviewStatus muss APPROVED, NEEDS_REVISION oder REJECTED sein.',
    );
  }

  return value as ReportReviewDecisionStatus;
}

export function normalizeJobReportCreateInput(input: JobReportCreateInput) {
  if (!input || typeof input !== 'object') {
    throw new BadRequestException('Ungueltiger Berichtspayload.');
  }

  const payload = {
    summary: ensureNonEmptyString(input.summary, 'summary'),
    details: ensureOptionalString(input.details),
    teamId: ensureOptionalString(input.teamId),
    type: ensureJobReportType(input.type),
    findingSummary: ensureOptionalString(input.findingSummary),
    workPerformed: ensureOptionalString(input.workPerformed),
    workStillNeeded: ensureOptionalString(input.workStillNeeded),
    followUpRequired: ensureFollowUpRequired(input.followUpRequired),
    followUpNotes: ensureOptionalString(input.followUpNotes),
  };

  if (
    (payload.type === 'WORKER_FINDING' || payload.type === 'INCIDENT_REPORT') &&
    ![
      payload.findingSummary,
      payload.workPerformed,
      payload.workStillNeeded,
      payload.details,
      payload.followUpNotes,
    ].some(Boolean)
  ) {
    throw new BadRequestException(
      'Worker-Fund- und Stoerungsberichte benoetigen mindestens ein inhaltliches Detailfeld.',
    );
  }

  return payload;
}

export function normalizeJobReportReviewInput(input: JobReportReviewInput) {
  if (!input || typeof input !== 'object') {
    throw new BadRequestException('Ungueltiger Pruefpayload.');
  }

  return {
    reviewStatus: ensureReviewDecisionStatus(input.reviewStatus),
    reviewNotes: ensureOptionalString(input.reviewNotes),
  };
}
