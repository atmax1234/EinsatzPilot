import type {
  JobAttachmentItem,
  JobReportItem,
  PhotoLibraryResponse,
  ReportReviewStatus,
} from '@einsatzpilot/types';

import { fetchApiJson, getApiBaseUrl } from './api';
import { getJobDetailData, getJobsData } from './operations';
import { getStoredSessionToken } from './server-auth';

export type ReportReviewEntry = {
  jobId: string;
  jobReference: string;
  jobTitle: string;
  customerName: string;
  location: string;
  report: JobReportItem;
  attachments: JobAttachmentItem[];
};

export type JobReviewSummary = {
  jobId: string;
  jobReference: string;
  jobTitle: string;
  customerName: string;
  location: string;
  reportCount: number;
  attachmentCount: number;
};

export type ReportsOverviewData = {
  reports: ReportReviewEntry[];
  photoAttachments: JobAttachmentItem[];
  fileAttachments: JobAttachmentItem[];
  jobsWithReview: JobReviewSummary[];
};

export type ReportsViewScope = 'ALL' | 'REPORTS' | 'PHOTOS' | 'FILES';

export type ReportsOverviewFilters = {
  query?: string;
  jobId?: string;
  teamId?: string;
};

export type ReportFilterOption = {
  id: string;
  label: string;
};

export type ReviewFeedEntry = {
  id: string;
  kind: 'REPORT' | 'PHOTO' | 'FILE';
  createdAt: string;
  title: string;
  subtitle: string;
  jobId: string;
  jobReference: string;
  jobTitle: string;
  teamName?: string;
  href: string;
  attachmentId?: string;
};

export function getReportReviewStatusLabel(status: ReportReviewStatus) {
  return {
    SUBMITTED: 'Eingereicht',
  }[status];
}

export function getAttachmentKindLabel(kind: JobAttachmentItem['kind']) {
  return {
    PHOTO: 'Foto',
    FILE: 'Datei',
  }[kind];
}

export function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  const kiloBytes = sizeBytes / 1024;

  if (kiloBytes < 1024) {
    return `${kiloBytes.toFixed(1)} KB`;
  }

  return `${(kiloBytes / 1024).toFixed(1)} MB`;
}

export function getAttachmentProxyUrl(attachmentId: string) {
  return `/api/attachments/${attachmentId}/file`;
}

function normalizeSearchQuery(value?: string) {
  return value?.trim().toLowerCase();
}

function matchesSearchQuery(
  query: string | undefined,
  candidates: Array<string | undefined>,
) {
  if (!query) {
    return true;
  }

  return candidates.some((candidate) => candidate?.toLowerCase().includes(query));
}

async function getAuthTokenOrThrow() {
  const token = await getStoredSessionToken();

  if (!token) {
    throw new Error('Session-Token fehlt.');
  }

  return token;
}

export async function getPhotoLibraryData() {
  const token = await getAuthTokenOrThrow();

  return fetchApiJson<PhotoLibraryResponse>('/api/attachments/photos', {
    authToken: token,
  });
}

export async function getReportsOverviewData(): Promise<{
  ok: boolean;
  data?: ReportsOverviewData;
  error?: string;
}> {
  const jobsResult = await getJobsData();

  if (!jobsResult.ok || !jobsResult.data) {
    return {
      ok: false,
      error: jobsResult.error ?? 'Auftragsdaten konnten nicht geladen werden.',
    };
  }

  const jobDetails = await Promise.all(
    jobsResult.data.jobs.map(async (job) => {
      const detailResult = await getJobDetailData(job.id);

      return detailResult.ok && detailResult.data ? detailResult.data.job : null;
    }),
  );

  const hydratedJobs = jobDetails.filter((job) => job !== null);
  const photoLibraryResult = await getPhotoLibraryData();

  const reports = hydratedJobs
    .flatMap((job) =>
      (job.reports ?? []).map((report) => ({
        jobId: job.id,
        jobReference: job.reference,
        jobTitle: job.title,
        customerName: job.customerName,
        location: job.location,
        report,
        attachments: (job.attachments ?? []).filter((attachment) => attachment.report?.id === report.id),
      })),
    )
    .sort((left, right) => Date.parse(right.report.createdAt) - Date.parse(left.report.createdAt));

  const fileAttachments = hydratedJobs
    .flatMap((job) => job.attachments ?? [])
    .filter((attachment) => attachment.kind === 'FILE')
    .sort((left, right) => Date.parse(right.uploadedAt) - Date.parse(left.uploadedAt));

  const jobsWithReview = hydratedJobs
    .filter((job) => (job.reports?.length ?? 0) > 0 || (job.attachments?.length ?? 0) > 0)
    .map((job) => ({
      jobId: job.id,
      jobReference: job.reference,
      jobTitle: job.title,
      customerName: job.customerName,
      location: job.location,
      reportCount: job.reports?.length ?? 0,
      attachmentCount: job.attachments?.length ?? 0,
    }))
    .sort((left, right) => right.reportCount + right.attachmentCount - (left.reportCount + left.attachmentCount));

  return {
    ok: true,
    data: {
      reports,
      photoAttachments: photoLibraryResult.ok && photoLibraryResult.data ? photoLibraryResult.data.attachments : [],
      fileAttachments,
      jobsWithReview,
    },
  };
}

export function getApiAttachmentUrl(attachmentId: string) {
  return `${getApiBaseUrl()}/api/attachments/${attachmentId}/file`;
}

export function getReportsFilterOptions(data: ReportsOverviewData): {
  jobs: ReportFilterOption[];
  teams: ReportFilterOption[];
} {
  const jobs = new Map<string, ReportFilterOption>();
  const teams = new Map<string, ReportFilterOption>();

  data.jobsWithReview.forEach((job) => {
    jobs.set(job.jobId, {
      id: job.jobId,
      label: `${job.jobReference} · ${job.jobTitle}`,
    });
  });

  data.reports.forEach((entry) => {
    if (entry.report.team) {
      teams.set(entry.report.team.id, {
        id: entry.report.team.id,
        label: entry.report.team.name,
      });
    }
  });

  [...data.photoAttachments, ...data.fileAttachments].forEach((attachment) => {
    if (attachment.team) {
      teams.set(attachment.team.id, {
        id: attachment.team.id,
        label: attachment.team.name,
      });
    }
  });

  return {
    jobs: [...jobs.values()].sort((left, right) => left.label.localeCompare(right.label, 'de')),
    teams: [...teams.values()].sort((left, right) => left.label.localeCompare(right.label, 'de')),
  };
}

export function filterReportsOverviewData(
  data: ReportsOverviewData,
  filters: ReportsOverviewFilters,
): ReportsOverviewData {
  const query = normalizeSearchQuery(filters.query);
  const sourceJobSummaries = new Map(
    data.jobsWithReview.map((job) => [
      job.jobId,
      {
        customerName: job.customerName,
        location: job.location,
      },
    ]),
  );
  const filteredReports = data.reports.filter((entry) => {
    if (filters.jobId && entry.jobId !== filters.jobId) {
      return false;
    }

    if (filters.teamId && entry.report.team?.id !== filters.teamId) {
      return false;
    }

    return matchesSearchQuery(query, [
      entry.report.summary,
      entry.report.details,
      entry.jobReference,
      entry.jobTitle,
      entry.customerName,
      entry.location,
      entry.report.author?.name,
      entry.report.team?.name,
    ]);
  });

  const filteredPhotos = data.photoAttachments.filter((attachment) => {
    if (filters.jobId && attachment.job.id !== filters.jobId) {
      return false;
    }

    if (filters.teamId && attachment.team?.id !== filters.teamId) {
      return false;
    }

    return matchesSearchQuery(query, [
      attachment.fileName,
      attachment.caption,
      attachment.job.reference,
      attachment.job.title,
      attachment.report?.summary,
      attachment.team?.name,
      attachment.uploadedBy?.name,
    ]);
  });

  const filteredFiles = data.fileAttachments.filter((attachment) => {
    if (filters.jobId && attachment.job.id !== filters.jobId) {
      return false;
    }

    if (filters.teamId && attachment.team?.id !== filters.teamId) {
      return false;
    }

    return matchesSearchQuery(query, [
      attachment.fileName,
      attachment.caption,
      attachment.mimeType,
      attachment.job.reference,
      attachment.job.title,
      attachment.report?.summary,
      attachment.team?.name,
      attachment.uploadedBy?.name,
    ]);
  });

  const jobsWithReviewMap = new Map<string, JobReviewSummary>();

  const ensureJobSummary = (input: {
    jobId: string;
    jobReference: string;
    jobTitle: string;
    customerName: string;
    location: string;
  }) => {
    const existingSummary = jobsWithReviewMap.get(input.jobId);

    if (existingSummary) {
      return existingSummary;
    }

    const nextSummary: JobReviewSummary = {
      jobId: input.jobId,
      jobReference: input.jobReference,
      jobTitle: input.jobTitle,
      customerName: input.customerName,
      location: input.location,
      reportCount: 0,
      attachmentCount: 0,
    };

    jobsWithReviewMap.set(input.jobId, nextSummary);
    return nextSummary;
  };

  filteredReports.forEach((entry) => {
    ensureJobSummary(entry).reportCount += 1;
  });

  [...filteredPhotos, ...filteredFiles].forEach((attachment) => {
    const sourceJobSummary = sourceJobSummaries.get(attachment.job.id);

    ensureJobSummary({
      jobId: attachment.job.id,
      jobReference: attachment.job.reference,
      jobTitle: attachment.job.title,
      customerName: sourceJobSummary?.customerName ?? '',
      location: sourceJobSummary?.location ?? '',
    }).attachmentCount += 1;
  });

  const jobsWithReview = [...jobsWithReviewMap.values()].sort(
    (left, right) =>
      right.reportCount + right.attachmentCount - (left.reportCount + left.attachmentCount),
  );

  return {
    reports: filteredReports,
    photoAttachments: filteredPhotos,
    fileAttachments: filteredFiles,
    jobsWithReview,
  };
}

export function getLatestReviewFeed(
  data: ReportsOverviewData,
  limit = 8,
): ReviewFeedEntry[] {
  return [
    ...data.reports.map((entry) => ({
      id: entry.report.id,
      kind: 'REPORT' as const,
      createdAt: entry.report.createdAt,
      title: entry.report.summary,
      subtitle: `${entry.jobReference} · ${entry.jobTitle}`,
      jobId: entry.jobId,
      jobReference: entry.jobReference,
      jobTitle: entry.jobTitle,
      teamName: entry.report.team?.name,
      href: `/jobs/${entry.jobId}`,
    })),
    ...data.photoAttachments.map((attachment) => ({
      id: attachment.id,
      kind: 'PHOTO' as const,
      createdAt: attachment.uploadedAt,
      title: attachment.caption ?? attachment.fileName,
      subtitle: `${attachment.job.reference} · ${attachment.job.title}`,
      jobId: attachment.job.id,
      jobReference: attachment.job.reference,
      jobTitle: attachment.job.title,
      teamName: attachment.team?.name,
      href: `/jobs/${attachment.job.id}`,
      attachmentId: attachment.id,
    })),
    ...data.fileAttachments.map((attachment) => ({
      id: attachment.id,
      kind: 'FILE' as const,
      createdAt: attachment.uploadedAt,
      title: attachment.fileName,
      subtitle: `${attachment.job.reference} · ${attachment.job.title}`,
      jobId: attachment.job.id,
      jobReference: attachment.job.reference,
      jobTitle: attachment.job.title,
      teamName: attachment.team?.name,
      href: `/jobs/${attachment.job.id}`,
      attachmentId: attachment.id,
    })),
  ]
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
    .slice(0, limit);
}
