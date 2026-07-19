import { BadRequestException } from '@nestjs/common';

import type {
  ReportReviewDecisionStatus,
  ReportReviewStatus,
} from '@einsatzpilot/types';

const allowedReviewTransitions: Record<ReportReviewStatus, ReportReviewDecisionStatus[]> = {
  SUBMITTED: ['APPROVED', 'NEEDS_REVISION', 'REJECTED'],
  PENDING_REVIEW: ['APPROVED', 'NEEDS_REVISION', 'REJECTED'],
  APPROVED: [],
  NEEDS_REVISION: [],
  REJECTED: [],
};

export function assertReportReviewTransition(
  currentStatus: ReportReviewStatus,
  nextStatus: ReportReviewDecisionStatus,
) {
  if (!allowedReviewTransitions[currentStatus].includes(nextStatus)) {
    throw new BadRequestException(
      `Berichtsstatus kann nicht von ${currentStatus} nach ${nextStatus} geaendert werden.`,
    );
  }
}
