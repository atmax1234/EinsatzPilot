import { BadRequestException } from '@nestjs/common';

import type { WorkdaySheetStatus } from '@einsatzpilot/types';

const allowedTransitions: Record<WorkdaySheetStatus, WorkdaySheetStatus[]> = {
  DRAFT: ['SENT'],
  SENT: ['SUBMITTED'],
  SUBMITTED: ['REVIEWED'],
  REVIEWED: ['ARCHIVED'],
  ARCHIVED: [],
};

export function assertWorkdaySheetStatusTransition(
  currentStatus: WorkdaySheetStatus,
  nextStatus: WorkdaySheetStatus,
) {
  if (!allowedTransitions[currentStatus].includes(nextStatus)) {
    throw new BadRequestException(
      `Statuswechsel von ${currentStatus} nach ${nextStatus} ist nicht erlaubt.`,
    );
  }
}
