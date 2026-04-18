import { BadRequestException } from '@nestjs/common';

import type { JobReportCreateInput } from '@einsatzpilot/types';

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

export function normalizeJobReportCreateInput(input: JobReportCreateInput) {
  return {
    summary: ensureNonEmptyString(input.summary, 'summary'),
    details: ensureOptionalString(input.details),
    teamId: ensureOptionalString(input.teamId),
  };
}
