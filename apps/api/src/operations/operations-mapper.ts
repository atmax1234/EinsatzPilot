import type { JobStatus as PrismaJobStatus } from '@prisma/client';

import type {
  CompanyMemberItem,
  JobDetailResponse,
  JobListItem,
  JobStatus,
  TeamListItem,
} from '@einsatzpilot/types';

import { mapJobAttachmentItem, mapJobReportItem } from '../reports/reports-mapper';

function mapDbJobStatus(status: PrismaJobStatus): JobStatus {
  return status as JobStatus;
}

export function mapJobListItem(job: {
  id: string;
  reference: string;
  title: string;
  customerName: string;
  location: string;
  scheduledStart: Date;
  scheduledEnd: Date | null;
  status: JobListItem['status'];
  priority: JobListItem['priority'];
  team: null | {
    id: string;
    name: string;
  };
}): JobListItem {
  return {
    id: job.id,
    reference: job.reference,
    title: job.title,
    customerName: job.customerName,
    location: job.location,
    scheduledStart: job.scheduledStart.toISOString(),
    scheduledEnd: job.scheduledEnd?.toISOString(),
    status: mapDbJobStatus(job.status),
    priority: job.priority,
    assignedTeam: job.team
      ? {
          id: job.team.id,
          name: job.team.name,
        }
      : undefined,
  };
}

export function mapTeamListItem(team: {
  id: string;
  name: string;
  code: string | null;
  specialty: string | null;
  status: TeamListItem['status'];
  currentAssignment: string | null;
  members: Array<{
    roleLabel: string | null;
    user: {
      id: string;
      email: string;
      displayName: string | null;
    };
  }>;
}): TeamListItem {
  return {
    id: team.id,
    name: team.name,
    code: team.code ?? undefined,
    specialty: team.specialty ?? undefined,
    status: team.status,
    currentAssignment: team.currentAssignment ?? undefined,
    memberCount: team.members.length,
    members: team.members.map((member) => ({
      id: member.user.id,
      name: member.user.displayName ?? member.user.email,
      email: member.user.email,
      roleLabel: member.roleLabel ?? undefined,
    })),
  };
}

export function mapCompanyMemberItem(membership: {
  role: CompanyMemberItem['membershipRole'];
  user: {
    id: string;
    email: string;
    displayName: string | null;
  };
}): CompanyMemberItem {
  return {
    id: membership.user.id,
    name: membership.user.displayName ?? membership.user.email,
    email: membership.user.email,
    membershipRole: membership.role,
  };
}

export function mapJobDetailResponse(job: {
  id: string;
  reference: string;
  title: string;
  customerName: string;
  location: string;
  scheduledStart: Date;
  scheduledEnd: Date | null;
  status: JobListItem['status'];
  priority: JobListItem['priority'];
  description: string | null;
  team: null | {
    id: string;
    name: string;
    members: Array<{
      roleLabel: string | null;
      user: {
        id: string;
        email: string;
        displayName: string | null;
      };
    }>;
  };
  activity: Array<{
    id: string;
    kind: 'STATUS' | 'NOTE' | 'REPORT';
    title: string;
    content: string | null;
    createdAt: Date;
    authorName: string | null;
  }>;
  reports: Array<{
    id: string;
    summary: string;
    details: string | null;
    reviewStatus: 'SUBMITTED';
    createdAt: Date;
    updatedAt: Date;
    author: {
      id: string;
      email: string;
      displayName: string | null;
    } | null;
    team: {
      id: string;
      name: string;
    } | null;
  }>;
  attachments: Array<{
    id: string;
    kind: 'PHOTO' | 'FILE';
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
    report: {
      id: string;
      summary: string;
    } | null;
    team: {
      id: string;
      name: string;
    } | null;
    uploader: {
      id: string;
      email: string;
      displayName: string | null;
    } | null;
  }>;
}): JobDetailResponse {
  return {
    job: {
      ...mapJobListItem(job),
      description: job.description ?? undefined,
      assignedTeamMembers:
        job.team?.members.map((member) => ({
          id: member.user.id,
          name: member.user.displayName ?? member.user.email,
          email: member.user.email,
          roleLabel: member.roleLabel ?? undefined,
        })) ?? [],
      activity: job.activity.map((entry) => ({
        id: entry.id,
        kind: entry.kind,
        title: entry.title,
        content: entry.content ?? undefined,
        createdAt: entry.createdAt.toISOString(),
        authorName: entry.authorName ?? undefined,
      })),
      reports: job.reports.map((report) => mapJobReportItem(report)),
      attachments: job.attachments.map((attachment) => mapJobAttachmentItem(attachment)),
    },
  };
}
