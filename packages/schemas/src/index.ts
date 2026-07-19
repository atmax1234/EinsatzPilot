import type {
  AssignmentEntityType,
  AssignmentKind,
  AssignmentStatus,
  AttachmentKind,
  CustomerType,
  JobReportType,
  JobEditableStatus,
  JobPriority,
  ItemKind,
  ItemStatus,
  ItemTrackingMode,
  ItemUnit,
  MembershipRole,
  ObjectAreaType,
  ObjectStatus,
  ObjectType,
  ReportReviewDecisionStatus,
  ReportReviewStatus,
  TeamStatus,
} from '@einsatzpilot/types';

export const membershipRoles = ['OWNER', 'OFFICE', 'WORKER'] as const satisfies readonly MembershipRole[];
export const jobStatuses = ['PLANNED', 'IN_PROGRESS', 'DONE', 'CANCELED'] as const;
export const teamStatuses = ['ACTIVE', 'INACTIVE'] as const;
export const jobEditableStatuses = ['PLANNED', 'IN_PROGRESS', 'DONE', 'CANCELED'] as const satisfies readonly JobEditableStatus[];
export const jobPriorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const satisfies readonly JobPriority[];
export const attachmentKinds = ['PHOTO', 'FILE'] as const satisfies readonly AttachmentKind[];
export const jobReportTypes = [
  'GENERAL',
  'WORKER_FINDING',
  'WORK_COMPLETION',
  'INCIDENT_REPORT',
  'FOLLOW_UP_REQUEST',
] as const satisfies readonly JobReportType[];
export const reportReviewStatuses = [
  'SUBMITTED',
  'PENDING_REVIEW',
  'APPROVED',
  'NEEDS_REVISION',
  'REJECTED',
] as const satisfies readonly ReportReviewStatus[];
export const reportReviewDecisionStatuses = [
  'APPROVED',
  'NEEDS_REVISION',
  'REJECTED',
] as const satisfies readonly ReportReviewDecisionStatus[];
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
export const itemKinds = [
  'MATERIAL',
  'TOOL',
  'ASSET',
  'CONSUMABLE',
  'PACKAGE',
  'OTHER',
] as const satisfies readonly ItemKind[];
export const itemUnits = [
  'PIECE',
  'KG',
  'LITER',
  'METER',
  'SQUARE_METER',
  'CUBIC_METER',
  'PALLET',
  'BOX',
  'BAG',
  'OTHER',
] as const satisfies readonly ItemUnit[];
export const itemTrackingModes = [
  'QUANTITY',
  'SERIALIZED',
] as const satisfies readonly ItemTrackingMode[];
export const itemStatuses = [
  'ACTIVE',
  'INACTIVE',
  'DAMAGED',
  'LOST',
  'ARCHIVED',
] as const satisfies readonly ItemStatus[];
export const assignmentEntityTypes = [
  'USER',
  'TEAM',
  'JOB',
  'CUSTOMER',
  'ADDRESS',
  'OBJECT',
  'OBJECT_AREA',
  'ITEM',
] as const satisfies readonly AssignmentEntityType[];
export const assignmentKinds = [
  'RESPONSIBLE',
  'SCHEDULED',
  'ALLOCATED',
  'RESERVED',
  'SUPPORTING',
  'OTHER',
] as const satisfies readonly AssignmentKind[];
export const assignmentStatuses = [
  'ACTIVE',
  'PLANNED',
  'ENDED',
  'CANCELED',
] as const satisfies readonly AssignmentStatus[];

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

export function parseJobReportType(rawType: string | undefined): JobReportType | undefined {
  if (!rawType) {
    return undefined;
  }

  const normalized = rawType.toUpperCase() as JobReportType;
  return jobReportTypes.includes(normalized) ? normalized : undefined;
}

export function parseReportReviewStatus(
  rawStatus: string | undefined,
): ReportReviewStatus | undefined {
  if (!rawStatus) {
    return undefined;
  }

  const normalized = rawStatus.toUpperCase() as ReportReviewStatus;
  return reportReviewStatuses.includes(normalized) ? normalized : undefined;
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

export function parseItemKind(rawKind: string | undefined): ItemKind | undefined {
  if (!rawKind) {
    return undefined;
  }

  const normalized = rawKind.toUpperCase() as ItemKind;
  return itemKinds.includes(normalized) ? normalized : undefined;
}

export function parseItemUnit(rawUnit: string | undefined): ItemUnit | undefined {
  if (!rawUnit) {
    return undefined;
  }

  const normalized = rawUnit.toUpperCase() as ItemUnit;
  return itemUnits.includes(normalized) ? normalized : undefined;
}

export function parseItemTrackingMode(
  rawMode: string | undefined,
): ItemTrackingMode | undefined {
  if (!rawMode) {
    return undefined;
  }

  const normalized = rawMode.toUpperCase() as ItemTrackingMode;
  return itemTrackingModes.includes(normalized) ? normalized : undefined;
}

export function parseItemStatus(rawStatus: string | undefined): ItemStatus | undefined {
  if (!rawStatus) {
    return undefined;
  }

  const normalized = rawStatus.toUpperCase() as ItemStatus;
  return itemStatuses.includes(normalized) ? normalized : undefined;
}

export function parseAssignmentEntityType(
  rawType: string | undefined,
): AssignmentEntityType | undefined {
  if (!rawType) {
    return undefined;
  }

  const normalized = rawType.toUpperCase() as AssignmentEntityType;
  return assignmentEntityTypes.includes(normalized) ? normalized : undefined;
}

export function parseAssignmentKind(rawKind: string | undefined): AssignmentKind | undefined {
  if (!rawKind) {
    return undefined;
  }

  const normalized = rawKind.toUpperCase() as AssignmentKind;
  return assignmentKinds.includes(normalized) ? normalized : undefined;
}

export function parseAssignmentStatus(
  rawStatus: string | undefined,
): AssignmentStatus | undefined {
  if (!rawStatus) {
    return undefined;
  }

  const normalized = rawStatus.toUpperCase() as AssignmentStatus;
  return assignmentStatuses.includes(normalized) ? normalized : undefined;
}
