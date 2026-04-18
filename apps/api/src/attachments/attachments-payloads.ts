import { BadRequestException } from '@nestjs/common';

import type { AttachmentKind } from '@einsatzpilot/types';

function ensureOptionalString(value: unknown) {
  if (value == null || value === '') {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new BadRequestException('Ungueltiger Textwert im Upload-Payload.');
  }

  const trimmed = value.trim();
  return trimmed || undefined;
}

export function normalizeAttachmentKind(value: unknown, mimeType: string): AttachmentKind {
  if (value === undefined || value === null || value === '') {
    return mimeType.startsWith('image/') ? 'PHOTO' : 'FILE';
  }

  if (value === 'PHOTO' || value === 'FILE') {
    return value;
  }

  throw new BadRequestException('kind ist ungueltig.');
}

export function normalizeAttachmentUploadInput(input: {
  caption?: unknown;
  reportId?: unknown;
  teamId?: unknown;
  kind?: unknown;
}) {
  return {
    caption: ensureOptionalString(input.caption),
    reportId: ensureOptionalString(input.reportId),
    teamId: ensureOptionalString(input.teamId),
    kind: input.kind,
  };
}
