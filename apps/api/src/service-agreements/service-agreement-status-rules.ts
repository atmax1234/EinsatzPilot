import { BadRequestException } from '@nestjs/common';

import type { ServiceAgreementStatus } from '@einsatzpilot/types';

const transitions: Record<ServiceAgreementStatus, ServiceAgreementStatus[]> = {
  DRAFT: ['ACTIVE', 'ARCHIVED'],
  ACTIVE: ['INACTIVE'],
  INACTIVE: ['ACTIVE', 'ARCHIVED'],
  ARCHIVED: [],
};

export function assertServiceAgreementStatusTransition(
  current: ServiceAgreementStatus,
  target: ServiceAgreementStatus,
) {
  if (!transitions[current].includes(target)) {
    throw new BadRequestException(
      `Statuswechsel von ${current} nach ${target} ist fuer Leistungsvereinbarungen nicht erlaubt.`,
    );
  }
}
