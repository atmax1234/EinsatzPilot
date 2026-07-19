import type {
  AssignmentEntityOption,
  AssignmentEntityType,
  AssignmentListItem,
} from '@einsatzpilot/types';

type AssignmentRecord = {
  id: string;
  sourceType: AssignmentListItem['sourceType'];
  sourceId: string;
  targetType: AssignmentListItem['targetType'];
  targetId: string;
  kind: AssignmentListItem['kind'];
  status: AssignmentListItem['status'];
  startsAt: Date | null;
  endsAt: Date | null;
  notes: string | null;
  createdBy: {
    id: string;
    email: string;
    displayName: string | null;
  };
  createdAt: Date;
  updatedAt: Date;
};

function fallbackEntity(type: AssignmentEntityType, id: string): AssignmentEntityOption {
  return {
    type,
    id,
    label: `${type} ${id}`,
    detail: 'Verknuepfter Datensatz ist nicht mehr verfuegbar.',
  };
}

export function mapAssignmentListItem(
  record: AssignmentRecord,
  source?: AssignmentEntityOption,
  target?: AssignmentEntityOption,
): AssignmentListItem {
  return {
    id: record.id,
    sourceType: record.sourceType,
    sourceId: record.sourceId,
    source: source ?? fallbackEntity(record.sourceType, record.sourceId),
    targetType: record.targetType,
    targetId: record.targetId,
    target: target ?? fallbackEntity(record.targetType, record.targetId),
    kind: record.kind,
    status: record.status,
    startsAt: record.startsAt?.toISOString(),
    endsAt: record.endsAt?.toISOString(),
    notes: record.notes ?? undefined,
    createdBy: {
      id: record.createdBy.id,
      name: record.createdBy.displayName ?? record.createdBy.email,
      email: record.createdBy.email,
    },
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}
