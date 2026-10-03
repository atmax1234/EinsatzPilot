import { Prisma } from '@prisma/client';

import type {
  WorkdaySheetActorSummary,
  WorkdaySheetDetailResponse,
  WorkdaySheetListItem,
  WorksheetReviewActionItem,
  WorksheetReviewActionSourceSnapshotV1,
} from '@einsatzpilot/types';

const actorSelect = {
  id: true,
  email: true,
  displayName: true,
} as const;

const workdaySheetListRelations = {
  team: {
    select: {
      id: true,
      name: true,
    },
  },
  worker: { select: actorSelect },
  createdBy: { select: actorSelect },
  sentBy: { select: actorSelect },
  submittedBy: { select: actorSelect },
  reviewedBy: { select: actorSelect },
  archivedBy: { select: actorSelect },
} as const;

export const worksheetReviewActionInclude = {
  destinationJob: {
    select: { id: true, reference: true, title: true },
  },
  createdBy: { select: actorSelect },
} satisfies Prisma.WorksheetReviewActionInclude;

export const workdaySheetListInclude = {
  ...workdaySheetListRelations,
  rows: {
    select: { actualText: true },
  },
} satisfies Prisma.WorkdaySheetInclude;

export const workdaySheetInclude = {
  ...workdaySheetListRelations,
  rows: {
    include: {
      customer: {
        select: { id: true, name: true },
      },
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
      object: {
        select: { id: true, name: true },
      },
      objectArea: {
        select: { id: true, objectId: true, name: true },
      },
      job: {
        select: { id: true, reference: true, title: true },
      },
      reviewActions: {
        include: worksheetReviewActionInclude,
        orderBy: { createdAt: 'asc' as const },
      },
    },
    orderBy: [{ position: 'asc' as const }, { createdAt: 'asc' as const }],
  },
} satisfies Prisma.WorkdaySheetInclude;

export type WorkdaySheetRecord = Prisma.WorkdaySheetGetPayload<{
  include: typeof workdaySheetInclude;
}>;

export type WorkdaySheetListRecord = Prisma.WorkdaySheetGetPayload<{
  include: typeof workdaySheetListInclude;
}>;

export type WorksheetReviewActionRecord = Prisma.WorksheetReviewActionGetPayload<{
  include: typeof worksheetReviewActionInclude;
}>;

function mapActor(actor: {
  id: string;
  email: string;
  displayName: string | null;
}): WorkdaySheetActorSummary {
  return {
    id: actor.id,
    name: actor.displayName ?? actor.email,
    email: actor.email,
  };
}

export function mapWorksheetReviewAction(
  action: WorksheetReviewActionRecord,
): WorksheetReviewActionItem {
  return {
    id: action.id,
    sourceSheetId: action.sourceSheetId,
    sourceRowId: action.sourceRowId,
    type: action.type,
    status: action.status,
    sourceSnapshot:
      action.sourceSnapshot as unknown as WorksheetReviewActionSourceSnapshotV1,
    destinationJob: {
      id: action.destinationJob.id,
      reference: action.destinationJobReference,
      title: action.destinationJobTitle,
    },
    createdBy: mapActor(action.createdBy),
    completedAt: action.completedAt.toISOString(),
    createdAt: action.createdAt.toISOString(),
  };
}

export function mapWorkdaySheetListItem(
  sheet: WorkdaySheetRecord | WorkdaySheetListRecord,
): WorkdaySheetListItem {
  return {
    id: sheet.id,
    date: sheet.date.toISOString().slice(0, 10),
    title: sheet.title ?? undefined,
    status: sheet.status,
    teamId: sheet.teamId ?? undefined,
    workerUserId: sheet.workerUserId ?? undefined,
    team: sheet.team ?? undefined,
    worker: sheet.worker ? mapActor(sheet.worker) : undefined,
    rowCount: sheet.rows.length,
    completedRowCount: sheet.rows.filter((row) => row.actualText).length,
    createdBy: mapActor(sheet.createdBy),
    sentBy: sheet.sentBy ? mapActor(sheet.sentBy) : undefined,
    submittedBy: sheet.submittedBy ? mapActor(sheet.submittedBy) : undefined,
    reviewedBy: sheet.reviewedBy ? mapActor(sheet.reviewedBy) : undefined,
    archivedBy: sheet.archivedBy ? mapActor(sheet.archivedBy) : undefined,
    sentAt: sheet.sentAt?.toISOString(),
    submittedAt: sheet.submittedAt?.toISOString(),
    reviewedAt: sheet.reviewedAt?.toISOString(),
    archivedAt: sheet.archivedAt?.toISOString(),
    createdAt: sheet.createdAt.toISOString(),
    updatedAt: sheet.updatedAt.toISOString(),
  };
}

export function mapWorkdaySheetDetail(sheet: WorkdaySheetRecord): WorkdaySheetDetailResponse {
  return {
    workdaySheet: {
      ...mapWorkdaySheetListItem(sheet),
      internalNotes: sheet.internalNotes ?? undefined,
      reviewNotes: sheet.reviewNotes ?? undefined,
      rows: sheet.rows.map((row) => ({
        id: row.id,
        position: row.position,
        startTime: row.startTime ?? undefined,
        endTime: row.endTime ?? undefined,
        plannedText: row.plannedText,
        actualText: row.actualText ?? undefined,
        notes: row.notes ?? undefined,
        customerId: row.customerId ?? undefined,
        addressId: row.addressId ?? undefined,
        objectId: row.objectId ?? undefined,
        objectAreaId: row.objectAreaId ?? undefined,
        jobId: row.jobId ?? undefined,
        customer: row.customer ?? undefined,
        address: row.address ?? undefined,
        object: row.object ?? undefined,
        objectArea: row.objectArea ?? undefined,
        job: row.job ?? undefined,
        reviewActions: row.reviewActions.map(mapWorksheetReviewAction),
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      })),
    },
  };
}
