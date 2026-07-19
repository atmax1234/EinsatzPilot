import { BadRequestException } from '@nestjs/common';

import type { AssignmentStatus } from '@einsatzpilot/types';

const transitions: Record<AssignmentStatus, AssignmentStatus[]> = {
  PLANNED: ['ACTIVE', 'CANCELED'],
  ACTIVE: ['ENDED', 'CANCELED'],
  ENDED: [],
  CANCELED: [],
};

export function assertAssignmentStatusTransition(
  currentStatus: AssignmentStatus,
  nextStatus: AssignmentStatus,
) {
  if (currentStatus === nextStatus) {
    return;
  }

  if (!transitions[currentStatus].includes(nextStatus)) {
    throw new BadRequestException(
      `Zuweisungsstatus kann nicht von ${currentStatus} nach ${nextStatus} wechseln.`,
    );
  }
}
