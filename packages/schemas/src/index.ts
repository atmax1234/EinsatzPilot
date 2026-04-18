import type {
  AttachmentKind,
  JobEditableStatus,
  JobPriority,
  MembershipRole,
  ReportReviewStatus,
  TeamStatus,
} from '@einsatzpilot/types';

export const membershipRoles = ['OWNER', 'OFFICE', 'WORKER'] as const satisfies readonly MembershipRole[];
export const jobStatuses = ['PLANNED', 'IN_PROGRESS', 'DONE', 'CANCELED'] as const;
export const teamStatuses = ['ACTIVE', 'INACTIVE'] as const;
export const jobEditableStatuses = ['PLANNED', 'IN_PROGRESS', 'DONE', 'CANCELED'] as const satisfies readonly JobEditableStatus[];
export const jobPriorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const satisfies readonly JobPriority[];
export const attachmentKinds = ['PHOTO', 'FILE'] as const satisfies readonly AttachmentKind[];
export const reportReviewStatuses = ['SUBMITTED'] as const satisfies readonly ReportReviewStatus[];

export function parseMembershipRole(rawRole: string | undefined): MembershipRole | undefined {
  if (!rawRole) {
    return undefined;
  }

  const normalized = rawRole.toUpperCase() as MembershipRole;
  return membershipRoles.includes(normalized) ? normalized : undefined;
}

export function parseTeamStatus(rawStatus: string | undefined): TeamStatus | undefined {
  if (!rawStatus) {
    return undefined;
  }

  const normalized = rawStatus.toUpperCase() as TeamStatus;
  return teamStatuses.includes(normalized) ? normalized : undefined;
}

export function parseJobPriority(rawPriority: string | undefined): JobPriority | undefined {
  if (!rawPriority) {
    return undefined;
  }

  const normalized = rawPriority.toUpperCase() as JobPriority;
  return jobPriorities.includes(normalized) ? normalized : undefined;
}

export function parseJobEditableStatus(rawStatus: string | undefined): JobEditableStatus | undefined {
  if (!rawStatus) {
    return undefined;
  }

  const normalized = rawStatus.toUpperCase() as JobEditableStatus;
  return jobEditableStatuses.includes(normalized) ? normalized : undefined;
}

export function parseAttachmentKind(rawKind: string | undefined): AttachmentKind | undefined {
  if (!rawKind) {
    return undefined;
  }

  const normalized = rawKind.toUpperCase() as AttachmentKind;
  return attachmentKinds.includes(normalized) ? normalized : undefined;
}
