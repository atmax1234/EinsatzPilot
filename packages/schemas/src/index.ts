import type {
  AttachmentKind,
  CustomerType,
  JobEditableStatus,
  JobPriority,
  MembershipRole,
  ObjectAreaType,
  ObjectStatus,
  ObjectType,
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
export const customerTypes = [
  'PRIVATE',
  'BUSINESS',
  'PROPERTY_MANAGEMENT',
  'OTHER',
] as const satisfies readonly CustomerType[];
export const objectTypes = [
  'BUILDING',
  'GARDEN',
  'WAREHOUSE',
  'CONSTRUCTION_SITE',
  'OFFICE',
  'FACILITY',
  'OTHER',
] as const satisfies readonly ObjectType[];
export const objectStatuses = ['ACTIVE', 'INACTIVE'] as const satisfies readonly ObjectStatus[];
export const objectAreaTypes = [
  'STAIRCASE',
  'BASEMENT',
  'ENTRANCE',
  'PARKING',
  'GARDEN_AREA',
  'ROOM',
  'STORAGE_AREA',
  'OTHER',
] as const satisfies readonly ObjectAreaType[];

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

export function parseCustomerType(rawType: string | undefined): CustomerType | undefined {
  if (!rawType) {
    return undefined;
  }

  const normalized = rawType.toUpperCase() as CustomerType;
  return customerTypes.includes(normalized) ? normalized : undefined;
}

export function parseObjectType(rawType: string | undefined): ObjectType | undefined {
  if (!rawType) {
    return undefined;
  }

  const normalized = rawType.toUpperCase() as ObjectType;
  return objectTypes.includes(normalized) ? normalized : undefined;
}

export function parseObjectStatus(rawStatus: string | undefined): ObjectStatus | undefined {
  if (!rawStatus) {
    return undefined;
  }

  const normalized = rawStatus.toUpperCase() as ObjectStatus;
  return objectStatuses.includes(normalized) ? normalized : undefined;
}

export function parseObjectAreaType(rawType: string | undefined): ObjectAreaType | undefined {
  if (!rawType) {
    return undefined;
  }

  const normalized = rawType.toUpperCase() as ObjectAreaType;
  return objectAreaTypes.includes(normalized) ? normalized : undefined;
}
