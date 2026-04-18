import type { JobAttachmentItem, JobReportItem } from '@einsatzpilot/types';

function mapUserSummary(user?: {
  id: string;
  email: string;
  displayName: string | null;
} | null) {
  if (!user) {
    return undefined;
  }

  return {
    id: user.id,
    name: user.displayName ?? user.email,
    email: user.email,
  };
}

function mapTeamSummary(team?: { id: string; name: string } | null) {
  if (!team) {
    return undefined;
  }

  return {
    id: team.id,
    name: team.name,
  };
}

export function mapJobReportItem(report: {
  id: string;
  summary: string;
  details: string | null;
  reviewStatus: JobReportItem['reviewStatus'];
  createdAt: Date;
  updatedAt: Date;
  author?: {
    id: string;
    email: string;
    displayName: string | null;
  } | null;
  team?: { id: string; name: string } | null;
}): JobReportItem {
  return {
    id: report.id,
    summary: report.summary,
    details: report.details ?? undefined,
    reviewStatus: report.reviewStatus,
    author: mapUserSummary(report.author),
    team: mapTeamSummary(report.team),
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
  };
}

export function mapJobAttachmentItem(attachment: {
  id: string;
  kind: JobAttachmentItem['kind'];
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  caption: string | null;
  createdAt: Date;
  job: {
    id: string;
    reference: string;
    title: string;
  };
  report?: {
    id: string;
    summary: string;
  } | null;
  team?: {
    id: string;
    name: string;
  } | null;
  uploader?: {
    id: string;
    email: string;
    displayName: string | null;
  } | null;
}): JobAttachmentItem {
  return {
    id: attachment.id,
    kind: attachment.kind,
    fileName: attachment.fileName,
    mimeType: attachment.mimeType,
    sizeBytes: attachment.sizeBytes,
    uploadedAt: attachment.createdAt.toISOString(),
    storagePath: attachment.storagePath,
    fileUrl: `/api/attachments/${attachment.id}/file`,
    caption: attachment.caption ?? undefined,
    job: attachment.job,
    report: attachment.report ?? undefined,
    team: mapTeamSummary(attachment.team),
    uploadedBy: mapUserSummary(attachment.uploader),
  };
}
