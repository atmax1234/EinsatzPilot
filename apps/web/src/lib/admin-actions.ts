'use server';

import type {
  JobEditableStatus,
  JobPriority,
  JobReportType,
  ReportReviewDecisionStatus,
  TeamStatus,
} from '@einsatzpilot/types';

import { redirect } from 'next/navigation';

import {
  addTeamMemberData,
  createJobReportData,
  createJobData,
  createTeamData,
  removeTeamMemberData,
  reviewJobReportData,
  transitionJobStatusData,
  uploadJobAttachmentData,
  updateJobData,
  updateTeamData,
} from './operations';

function getRequiredString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${key} ist erforderlich.`);
  }

  return value.trim();
}

function getOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed || undefined;
}

function getOptionalNullableString(formData: FormData, key: string) {
  const value = getOptionalString(formData, key);
  return value ?? null;
}

function toIsoDateTime(value: string, key: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`${key} ist kein gueltiges Datum.`);
  }

  return date.toISOString();
}

function getRequiredIsoDate(formData: FormData, key: string) {
  return toIsoDateTime(getRequiredString(formData, key), key);
}

function getOptionalIsoDate(formData: FormData, key: string) {
  const value = getOptionalString(formData, key);
  return value ? toIsoDateTime(value, key) : undefined;
}

function getOptionalNullableIsoDate(formData: FormData, key: string) {
  const value = getOptionalString(formData, key);
  return value ? toIsoDateTime(value, key) : null;
}

function redirectWith(path: string, params: Record<string, string | undefined>): never {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });

  redirect(searchParams.size > 0 ? `${path}?${searchParams.toString()}` : path);
}

function getJobPriority(formData: FormData): JobPriority {
  const priority = getRequiredString(formData, 'priority');

  if (priority === 'LOW' || priority === 'NORMAL' || priority === 'HIGH' || priority === 'URGENT') {
    return priority;
  }

  throw new Error('priority ist ungueltig.');
}

function getJobStatus(formData: FormData): JobEditableStatus {
  const status = getRequiredString(formData, 'status');

  if (
    status === 'PLANNED' ||
    status === 'IN_PROGRESS' ||
    status === 'DONE' ||
    status === 'CANCELED'
  ) {
    return status;
  }

  throw new Error('status ist ungueltig.');
}

function getTeamStatus(formData: FormData): TeamStatus {
  const status = getRequiredString(formData, 'status');

  if (status === 'ACTIVE' || status === 'INACTIVE') {
    return status;
  }

  throw new Error('status ist ungueltig.');
}

function getJobReportType(formData: FormData): JobReportType {
  const type = getRequiredString(formData, 'type');

  if (
    type === 'GENERAL' ||
    type === 'WORKER_FINDING' ||
    type === 'WORK_COMPLETION' ||
    type === 'INCIDENT_REPORT' ||
    type === 'FOLLOW_UP_REQUEST'
  ) {
    return type;
  }

  throw new Error('type ist ungueltig.');
}

function getReportReviewDecision(formData: FormData): ReportReviewDecisionStatus {
  const status = getRequiredString(formData, 'reviewStatus');

  if (status === 'APPROVED' || status === 'NEEDS_REVISION' || status === 'REJECTED') {
    return status;
  }

  throw new Error('reviewStatus ist ungueltig.');
}

export async function createJobAction(formData: FormData) {
  try {
    const result = await createJobData({
      title: getRequiredString(formData, 'title'),
      description: getOptionalString(formData, 'description'),
      customerName: getRequiredString(formData, 'customerName'),
      location: getRequiredString(formData, 'location'),
      scheduledStart: getRequiredIsoDate(formData, 'scheduledStart'),
      scheduledEnd: getOptionalIsoDate(formData, 'scheduledEnd'),
      priority: getJobPriority(formData),
      teamId: getOptionalString(formData, 'teamId'),
      customerId: getOptionalString(formData, 'customerId'),
      addressId: getOptionalString(formData, 'addressId'),
      objectId: getOptionalString(formData, 'objectId'),
      objectAreaId: getOptionalString(formData, 'objectAreaId'),
    });

    if (!result.ok || !result.data) {
      redirectWith('/jobs', {
        error: result.error ?? 'Auftrag konnte nicht erstellt werden.',
      });
    }

    redirectWith(`/jobs/${result.data.job.id}`, {
      notice: 'job-created',
    });
  } catch (error) {
    redirectWith('/jobs', {
      error: error instanceof Error ? error.message : 'Auftrag konnte nicht erstellt werden.',
    });
  }
}

export async function updateJobAction(jobId: string, formData: FormData) {
  try {
    const result = await updateJobData(jobId, {
      title: getRequiredString(formData, 'title'),
      description: getOptionalString(formData, 'description'),
      customerName: getRequiredString(formData, 'customerName'),
      location: getRequiredString(formData, 'location'),
      scheduledStart: getRequiredIsoDate(formData, 'scheduledStart'),
      scheduledEnd: getOptionalNullableIsoDate(formData, 'scheduledEnd'),
      priority: getJobPriority(formData),
      teamId: getOptionalNullableString(formData, 'teamId'),
      customerId: getOptionalNullableString(formData, 'customerId'),
      addressId: getOptionalNullableString(formData, 'addressId'),
      objectId: getOptionalNullableString(formData, 'objectId'),
      objectAreaId: getOptionalNullableString(formData, 'objectAreaId'),
    });

    if (!result.ok) {
      redirectWith(`/jobs/${jobId}`, {
        error: result.error ?? 'Auftrag konnte nicht aktualisiert werden.',
      });
    }

    redirectWith(`/jobs/${jobId}`, {
      notice: 'job-updated',
    });
  } catch (error) {
    redirectWith(`/jobs/${jobId}`, {
      error: error instanceof Error ? error.message : 'Auftrag konnte nicht aktualisiert werden.',
    });
  }
}

export async function transitionJobStatusAction(jobId: string, formData: FormData) {
  try {
    const result = await transitionJobStatusData(jobId, {
      status: getJobStatus(formData),
    });

    if (!result.ok) {
      redirectWith(`/jobs/${jobId}`, {
        error: result.error ?? 'Statuswechsel fehlgeschlagen.',
      });
    }

    redirectWith(`/jobs/${jobId}`, {
      notice: 'job-status-updated',
    });
  } catch (error) {
    redirectWith(`/jobs/${jobId}`, {
      error: error instanceof Error ? error.message : 'Statuswechsel fehlgeschlagen.',
    });
  }
}

export async function createJobReportAction(jobId: string, formData: FormData) {
  try {
    const result = await createJobReportData(jobId, {
      summary: getRequiredString(formData, 'summary'),
      details: getOptionalString(formData, 'details'),
      teamId: getOptionalString(formData, 'teamId'),
      type: getJobReportType(formData),
      findingSummary: getOptionalString(formData, 'findingSummary'),
      workPerformed: getOptionalString(formData, 'workPerformed'),
      workStillNeeded: getOptionalString(formData, 'workStillNeeded'),
      followUpRequired: formData.get('followUpRequired') === 'on',
      followUpNotes: getOptionalString(formData, 'followUpNotes'),
    });

    if (!result.ok) {
      redirectWith(`/jobs/${jobId}`, {
        error: result.error ?? 'Bericht konnte nicht angelegt werden.',
      });
    }

    redirectWith(`/jobs/${jobId}`, {
      notice: 'report-created',
    });
  } catch (error) {
    redirectWith(`/jobs/${jobId}`, {
      error: error instanceof Error ? error.message : 'Bericht konnte nicht angelegt werden.',
    });
  }
}

export async function reviewJobReportAction(
  jobId: string,
  reportId: string,
  formData: FormData,
) {
  try {
    const result = await reviewJobReportData(jobId, reportId, {
      reviewStatus: getReportReviewDecision(formData),
      reviewNotes: getOptionalString(formData, 'reviewNotes'),
    });

    if (!result.ok) {
      redirectWith(`/jobs/${jobId}`, {
        error: result.error ?? 'Bericht konnte nicht geprueft werden.',
      });
    }

    redirectWith(`/jobs/${jobId}`, {
      notice: 'report-reviewed',
    });
  } catch (error) {
    redirectWith(`/jobs/${jobId}`, {
      error: error instanceof Error ? error.message : 'Bericht konnte nicht geprueft werden.',
    });
  }
}

export async function uploadJobAttachmentAction(jobId: string, formData: FormData) {
  try {
    const file = formData.get('file');

    if (!(file instanceof File) || file.size === 0) {
      throw new Error('Datei ist erforderlich.');
    }

    const uploadFormData = new FormData();
    uploadFormData.append('file', file, file.name);

    const caption = getOptionalString(formData, 'caption');
    const reportId = getOptionalString(formData, 'reportId');
    const teamId = getOptionalString(formData, 'teamId');
    const kind = getOptionalString(formData, 'kind');

    if (caption) {
      uploadFormData.append('caption', caption);
    }

    if (reportId) {
      uploadFormData.append('reportId', reportId);
    }

    if (teamId) {
      uploadFormData.append('teamId', teamId);
    }

    if (kind) {
      uploadFormData.append('kind', kind);
    }

    const result = await uploadJobAttachmentData(jobId, uploadFormData);

    if (!result.ok) {
      redirectWith(`/jobs/${jobId}`, {
        error: result.error ?? 'Datei konnte nicht hochgeladen werden.',
      });
    }

    redirectWith(`/jobs/${jobId}`, {
      notice: 'attachment-uploaded',
    });
  } catch (error) {
    redirectWith(`/jobs/${jobId}`, {
      error: error instanceof Error ? error.message : 'Datei konnte nicht hochgeladen werden.',
    });
  }
}

export async function createTeamAction(formData: FormData) {
  try {
    const result = await createTeamData({
      name: getRequiredString(formData, 'name'),
      code: getOptionalString(formData, 'code'),
      specialty: getOptionalString(formData, 'specialty'),
      status: getTeamStatus(formData),
      currentAssignment: getOptionalString(formData, 'currentAssignment'),
    });

    if (!result.ok) {
      redirectWith('/teams', {
        error: result.error ?? 'Team konnte nicht erstellt werden.',
      });
    }

    redirectWith('/teams', {
      notice: 'team-created',
    });
  } catch (error) {
    redirectWith('/teams', {
      error: error instanceof Error ? error.message : 'Team konnte nicht erstellt werden.',
    });
  }
}

export async function updateTeamAction(teamId: string, formData: FormData) {
  try {
    const result = await updateTeamData(teamId, {
      name: getRequiredString(formData, 'name'),
      code: getOptionalNullableString(formData, 'code'),
      specialty: getOptionalNullableString(formData, 'specialty'),
      status: getTeamStatus(formData),
      currentAssignment: getOptionalNullableString(formData, 'currentAssignment'),
    });

    if (!result.ok) {
      redirectWith('/teams', {
        error: result.error ?? 'Team konnte nicht aktualisiert werden.',
      });
    }

    redirectWith('/teams', {
      notice: 'team-updated',
    });
  } catch (error) {
    redirectWith('/teams', {
      error: error instanceof Error ? error.message : 'Team konnte nicht aktualisiert werden.',
    });
  }
}

export async function addTeamMemberAction(teamId: string, formData: FormData) {
  try {
    const result = await addTeamMemberData(teamId, {
      userId: getRequiredString(formData, 'userId'),
      roleLabel: getOptionalString(formData, 'roleLabel'),
    });

    if (!result.ok) {
      redirectWith('/teams', {
        error: result.error ?? 'Teammitglied konnte nicht hinzugefuegt werden.',
      });
    }

    redirectWith('/teams', {
      notice: 'team-member-added',
    });
  } catch (error) {
    redirectWith('/teams', {
      error:
        error instanceof Error
          ? error.message
          : 'Teammitglied konnte nicht hinzugefuegt werden.',
    });
  }
}

export async function removeTeamMemberAction(teamId: string, userId: string) {
  try {
    const result = await removeTeamMemberData(teamId, userId);

    if (!result.ok) {
      redirectWith('/teams', {
        error: result.error ?? 'Teammitglied konnte nicht entfernt werden.',
      });
    }

    redirectWith('/teams', {
      notice: 'team-member-removed',
    });
  } catch (error) {
    redirectWith('/teams', {
      error:
        error instanceof Error ? error.message : 'Teammitglied konnte nicht entfernt werden.',
    });
  }
}
