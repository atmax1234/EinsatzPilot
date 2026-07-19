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
  type: JobReportItem['type'];
  summary: string;
  details: string | null;
  findingSummary: string | null;
  workPerformed: string | null;
  workStillNeeded: string | null;
  followUpRequired: boolean;
  followUpNotes: string | null;
  reviewStatus: JobReportItem['reviewStatus'];
  reviewNotes: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  author?: {
    id: string;
    email: string;
    displayName: string | null;
  } | null;
  team?: { id: string; name: string } | null;
  reviewer?: {
    id: string;
    email: string;
    displayName: string | null;
  } | null;
  attachments?: Array<{
    id: string;
    kind: JobAttachmentItem['kind'];
    fileName: string;
    caption: string | null;
    createdAt: Date;
  }>;
}): JobReportItem {
  return {
    id: report.id,
    type: report.type,
    summary: report.summary,
    details: report.details ?? undefined,
    findingSummary: report.findingSummary ?? undefined,
    workPerformed: report.workPerformed ?? undefined,
    workStillNeeded: report.workStillNeeded ?? undefined,
    followUpRequired: report.followUpRequired,
    followUpNotes: report.followUpNotes ?? undefined,
    reviewStatus: report.reviewStatus,
    reviewNotes: report.reviewNotes ?? undefined,
    reviewedAt: report.reviewedAt?.toISOString(),
    author: mapUserSummary(report.author),
    team: mapTeamSummary(report.team),
    reviewedBy: mapUserSummary(report.reviewer),
    attachments: (report.attachments ?? []).map((attachment) => ({
      id: attachment.id,
      kind: attachment.kind,
      fileName: attachment.fileName,
      caption: attachment.caption ?? undefined,
      uploadedAt: attachment.createdAt.toISOString(),
    })),
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
