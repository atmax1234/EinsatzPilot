import { BadRequestException } from '@nestjs/common';

import type { CustomerReportStatus } from '@einsatzpilot/types';

const allowedTransitions: Record<CustomerReportStatus, CustomerReportStatus[]> = {
  DRAFT: ['READY_FOR_REVIEW', 'ARCHIVED'],
  READY_FOR_REVIEW: ['APPROVED', 'DRAFT'],
  APPROVED: ['ARCHIVED'],
  ARCHIVED: [],
};

export function assertCustomerReportStatusTransition(
  current: CustomerReportStatus,
  next: CustomerReportStatus,
) {
  if (!allowedTransitions[current].includes(next)) {
    throw new BadRequestException(
      `Statuswechsel fuer Kundenbericht von ${current} nach ${next} ist nicht erlaubt.`,
    );
  }
}

export function assertCustomerReportDraft(status: CustomerReportStatus) {
  if (status !== 'DRAFT') {
    throw new BadRequestException('Nur Kundenberichte im Status DRAFT koennen bearbeitet werden.');
  }
}
