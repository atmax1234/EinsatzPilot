import type {
  CompanyMemberListResponse,
  DashboardResponse,
  JobAttachmentListResponse,
  JobCreateInput,
  JobDetailResponse,
  JobListResponse,
  JobPriority,
  JobReportCreateInput,
  JobReportListResponse,
  JobStatus,
  JobStatusTransitionInput,
  JobUpdateInput,
  TeamCreateInput,
  TeamListResponse,
  TeamStatus,
  TeamUpdateInput,
  TeamListItem,
  JobDetailResponse as JobDetailMutationResponse,
} from '@einsatzpilot/types';

import { fetchApiFormData, fetchApiJson } from './api';
import { getStoredSessionToken } from './server-auth';

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function getJobStatusLabel(status: JobStatus) {
  return {
    PLANNED: 'Geplant',
    IN_PROGRESS: 'In Bearbeitung',
    DONE: 'Abgeschlossen',
    CANCELED: 'Abgebrochen',
  }[status];
}

export function getJobPriorityLabel(priority: JobPriority) {
  return {
    LOW: 'Niedrig',
    NORMAL: 'Normal',
    HIGH: 'Hoch',
    URGENT: 'Dringend',
  }[priority];
}

export function getTeamStatusLabel(status: TeamStatus) {
  return {
    ACTIVE: 'Aktiv',
    INACTIVE: 'Inaktiv',
  }[status];
}

export function toDateTimeLocalValue(value?: string) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  const pad = (input: number) => String(input).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

async function getAuthTokenOrThrow() {
  const token = await getStoredSessionToken();

  if (!token) {
    throw new Error('Session-Token fehlt.');
  }

  return token;
}

export async function getDashboardData() {
  const token = await getAuthTokenOrThrow();
  return fetchApiJson<DashboardResponse>('/api/dashboard', {
    authToken: token,
  });
}

export async function getJobsData() {
  const token = await getAuthTokenOrThrow();
  return fetchApiJson<JobListResponse>('/api/jobs', {
    authToken: token,
  });
}

export async function getJobDetailData(jobId: string) {
  const token = await getAuthTokenOrThrow();
  return fetchApiJson<JobDetailResponse>(`/api/jobs/${jobId}`, {
    authToken: token,
  });
}

export async function getTeamsData() {
  const token = await getAuthTokenOrThrow();
  return fetchApiJson<TeamListResponse>('/api/teams', {
    authToken: token,
  });
}

export async function getCompanyMembersData() {
  const token = await getAuthTokenOrThrow();
  return fetchApiJson<CompanyMemberListResponse>('/api/company-members', {
    authToken: token,
  });
}

export async function createJobData(input: JobCreateInput) {
  const token = await getAuthTokenOrThrow();
  return fetchApiJson<JobDetailMutationResponse>('/api/jobs', {
    authToken: token,
    method: 'POST',
    json: input,
  });
}

export async function updateJobData(jobId: string, input: JobUpdateInput) {
  const token = await getAuthTokenOrThrow();
  return fetchApiJson<JobDetailMutationResponse>(`/api/jobs/${jobId}`, {
    authToken: token,
    method: 'PATCH',
    json: input,
  });
}

export async function transitionJobStatusData(jobId: string, input: JobStatusTransitionInput) {
  const token = await getAuthTokenOrThrow();
  return fetchApiJson<JobDetailMutationResponse>(`/api/jobs/${jobId}/status`, {
    authToken: token,
    method: 'PATCH',
    json: input,
  });
}

export async function createTeamData(input: TeamCreateInput) {
  const token = await getAuthTokenOrThrow();
  return fetchApiJson<TeamListItem>('/api/teams', {
    authToken: token,
    method: 'POST',
    json: input,
  });
}

export async function updateTeamData(teamId: string, input: TeamUpdateInput) {
  const token = await getAuthTokenOrThrow();
  return fetchApiJson<TeamListItem>(`/api/teams/${teamId}`, {
    authToken: token,
    method: 'PATCH',
    json: input,
  });
}

export async function createJobReportData(jobId: string, input: JobReportCreateInput) {
  const token = await getAuthTokenOrThrow();
  return fetchApiJson<JobReportListResponse>(`/api/jobs/${jobId}/reports`, {
    authToken: token,
    method: 'POST',
    json: input,
  });
}

export async function uploadJobAttachmentData(jobId: string, formData: FormData) {
  const token = await getAuthTokenOrThrow();
  return fetchApiFormData<JobAttachmentListResponse>(`/api/jobs/${jobId}/attachments`, {
    authToken: token,
    method: 'POST',
    formData,
  });
}

export async function addTeamMemberData(teamId: string, input: { userId: string; roleLabel?: string }) {
  const token = await getAuthTokenOrThrow();
  return fetchApiJson<TeamListItem>(`/api/teams/${teamId}/members`, {
    authToken: token,
    method: 'POST',
    json: input,
  });
}

export async function removeTeamMemberData(teamId: string, userId: string) {
  const token = await getAuthTokenOrThrow();
  return fetchApiJson<TeamListItem>(`/api/teams/${teamId}/members/${userId}`, {
    authToken: token,
    method: 'DELETE',
  });
}
