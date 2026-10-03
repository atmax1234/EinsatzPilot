import { Prisma } from '@prisma/client';

import type {
  RecurringObjectDutyItem,
  ServiceAgreementDetailResponse,
  ServiceAgreementListItem,
  WorkdaySheetActorSummary,
} from '@einsatzpilot/types';

const actorSelect = {
  id: true,
  email: true,
  displayName: true,
} as const;

const agreementRelations = {
  customer: { select: { id: true, name: true } },
  address: {
    select: {
      id: true,
      label: true,
      street: true,
      postalCode: true,
      city: true,
      country: true,
    },
  },
  object: { select: { id: true, name: true } },
  objectArea: { select: { id: true, objectId: true, name: true } },
  createdBy: { select: actorSelect },
  updatedBy: { select: actorSelect },
  activatedBy: { select: actorSelect },
  deactivatedBy: { select: actorSelect },
  archivedBy: { select: actorSelect },
} as const;

export const serviceAgreementListInclude = {
  ...agreementRelations,
  duties: { select: { isActive: true } },
} satisfies Prisma.ServiceAgreementInclude;

export const serviceAgreementDetailInclude = {
  ...agreementRelations,
  duties: {
    include: {
      createdBy: { select: actorSelect },
      updatedBy: { select: actorSelect },
    },
    orderBy: [{ position: 'asc' as const }, { createdAt: 'asc' as const }],
  },
} satisfies Prisma.ServiceAgreementInclude;

export type ServiceAgreementListRecord = Prisma.ServiceAgreementGetPayload<{
  include: typeof serviceAgreementListInclude;
}>;

export type ServiceAgreementDetailRecord = Prisma.ServiceAgreementGetPayload<{
  include: typeof serviceAgreementDetailInclude;
}>;

function mapActor(actor: {
  id: string;
  email: string;
  displayName: string | null;
}): WorkdaySheetActorSummary {
  return { id: actor.id, email: actor.email, name: actor.displayName ?? actor.email };
}

function mapDuty(
  duty: ServiceAgreementDetailRecord['duties'][number],
): RecurringObjectDutyItem {
  return {
    id: duty.id,
    position: duty.position,
    plannedText: duty.plannedText,
    notes: duty.notes ?? undefined,
    cadenceUnit: duty.cadenceUnit,
    cadenceInterval: duty.cadenceInterval,
    firstDueDate: duty.firstDueDate.toISOString().slice(0, 10),
    startTime: duty.startTime ?? undefined,
    endTime: duty.endTime ?? undefined,
    isActive: duty.isActive,
    createdBy: mapActor(duty.createdBy),
    updatedBy: mapActor(duty.updatedBy),
    createdAt: duty.createdAt.toISOString(),
    updatedAt: duty.updatedAt.toISOString(),
  };
}

export function mapServiceAgreementListItem(
  agreement: ServiceAgreementListRecord | ServiceAgreementDetailRecord,
): ServiceAgreementListItem {
  return {
    id: agreement.id,
    title: agreement.title,
    status: agreement.status,
    effectiveFrom: agreement.effectiveFrom.toISOString().slice(0, 10),
    effectiveUntil: agreement.effectiveUntil?.toISOString().slice(0, 10),
    timezone: agreement.timezone,
    customerId: agreement.customerId ?? undefined,
    addressId: agreement.addressId ?? undefined,
    objectId: agreement.objectId ?? undefined,
    objectAreaId: agreement.objectAreaId ?? undefined,
    customer: agreement.customer ?? undefined,
    address: agreement.address ?? undefined,
    object: agreement.object ?? undefined,
    objectArea: agreement.objectArea ?? undefined,
    dutyCount: agreement.duties.length,
    activeDutyCount: agreement.duties.filter((duty) => duty.isActive).length,
    createdBy: mapActor(agreement.createdBy),
    updatedBy: mapActor(agreement.updatedBy),
    activatedBy: agreement.activatedBy ? mapActor(agreement.activatedBy) : undefined,
    deactivatedBy: agreement.deactivatedBy ? mapActor(agreement.deactivatedBy) : undefined,
    archivedBy: agreement.archivedBy ? mapActor(agreement.archivedBy) : undefined,
    activatedAt: agreement.activatedAt?.toISOString(),
    deactivatedAt: agreement.deactivatedAt?.toISOString(),
    archivedAt: agreement.archivedAt?.toISOString(),
    createdAt: agreement.createdAt.toISOString(),
    updatedAt: agreement.updatedAt.toISOString(),
  };
}

export function mapServiceAgreementDetail(
  agreement: ServiceAgreementDetailRecord,
): ServiceAgreementDetailResponse {
  return {
    serviceAgreement: {
      ...mapServiceAgreementListItem(agreement),
      description: agreement.description ?? undefined,
      internalNotes: agreement.internalNotes ?? undefined,
      duties: agreement.duties.map(mapDuty),
    },
  };
}
