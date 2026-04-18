import { BadRequestException } from '@nestjs/common';

import type { JobStatus, RequestAuthContext } from '@einsatzpilot/types';

import { assertCanReopenJobs } from './operations-permissions';

const allowedTransitions: Record<JobStatus, JobStatus[]> = {
  PLANNED: ['IN_PROGRESS', 'CANCELED'],
  IN_PROGRESS: ['DONE', 'CANCELED'],
  DONE: ['PLANNED'],
  CANCELED: [],
};

export function canTransitionJobStatus(from: JobStatus, to: JobStatus) {
  return allowedTransitions[from].includes(to);
}

export function assertValidJobStatusTransition(input: {
  from: JobStatus;
  to: JobStatus;
  authContext: RequestAuthContext;
}) {
  const { from, to, authContext } = input;

  if (from === to) {
    throw new BadRequestException('Statuswechsel ohne echten Statusunterschied ist nicht erlaubt.');
  }

  if (from === 'DONE' && to === 'PLANNED') {
    assertCanReopenJobs(authContext);
    return;
  }

  if (!canTransitionJobStatus(from, to)) {
    throw new BadRequestException(
      `Statuswechsel von ${from} nach ${to} ist im aktuellen MVP nicht erlaubt.`,
    );
  }
}

export function getAllowedJobStatusTransitions(status: JobStatus): JobStatus[] {
  return [...allowedTransitions[status]];
}
