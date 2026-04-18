import type { JobActivityKind } from '@prisma/client';

import type { AuthenticatedUser, JobPriority, JobStatus } from '@einsatzpilot/types';

export type JobActivityDraft = {
  kind: JobActivityKind;
  title: string;
  content?: string;
  authorName?: string;
};

function getActorName(actor: AuthenticatedUser) {
  return actor.displayName ?? actor.email;
}

export function buildJobCreatedActivity(input: {
  actor: AuthenticatedUser;
  reference: string;
  title: string;
}): JobActivityDraft {
  return {
    kind: 'STATUS',
    title: 'Auftrag erstellt',
    content: `${input.reference} wurde als "${input.title}" angelegt.`,
    authorName: getActorName(input.actor),
  };
}

export function buildJobStatusChangedActivity(input: {
  actor: AuthenticatedUser;
  from: JobStatus;
  to: JobStatus;
}): JobActivityDraft {
  return {
    kind: 'STATUS',
    title: 'Status geaendert',
    content: `Statuswechsel von ${input.from} nach ${input.to}.`,
    authorName: getActorName(input.actor),
  };
}

export function buildJobUpdatedActivities(input: {
  actor: AuthenticatedUser;
  previousTeamName?: string;
  nextTeamName?: string;
  previousScheduledStart?: Date;
  nextScheduledStart?: Date;
  previousScheduledEnd?: Date | null;
  nextScheduledEnd?: Date | null;
  previousPriority?: JobPriority;
  nextPriority?: JobPriority;
  previousTitle?: string;
  nextTitle?: string;
}): JobActivityDraft[] {
  const activities: JobActivityDraft[] = [];
  const actorName = getActorName(input.actor);

  if (input.previousTeamName !== input.nextTeamName) {
    activities.push({
      kind: 'NOTE',
      title: 'Teamzuweisung geaendert',
      content: `Teamwechsel von ${input.previousTeamName ?? 'keinem Team'} zu ${input.nextTeamName ?? 'keinem Team'}.`,
      authorName: actorName,
    });
  }

  if (
    input.previousScheduledStart?.toISOString() !== input.nextScheduledStart?.toISOString() ||
    input.previousScheduledEnd?.toISOString() !== input.nextScheduledEnd?.toISOString()
  ) {
    activities.push({
      kind: 'NOTE',
      title: 'Termin aktualisiert',
      content: 'Start- oder Endzeit des Auftrags wurde angepasst.',
      authorName: actorName,
    });
  }

  if (input.previousPriority !== input.nextPriority) {
    activities.push({
      kind: 'NOTE',
      title: 'Prioritaet geaendert',
      content: `Prioritaet von ${input.previousPriority ?? 'unbekannt'} zu ${input.nextPriority ?? 'unbekannt'} angepasst.`,
      authorName: actorName,
    });
  }

  if (input.previousTitle !== input.nextTitle) {
    activities.push({
      kind: 'NOTE',
      title: 'Auftragstitel angepasst',
      content: `Titel von "${input.previousTitle ?? 'ohne Titel'}" zu "${input.nextTitle ?? 'ohne Titel'}" geaendert.`,
      authorName: actorName,
    });
  }

  return activities;
}
