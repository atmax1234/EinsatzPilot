import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type {
  AuthenticatedUser,
  CompanyMemberListResponse,
  DashboardJobStatusCounts,
  DashboardOfficeOverview,
  DashboardResponse,
  DashboardWorkdaySheetStatusCounts,
  JobListResponse,
  JobRelationOptionsResponse,
  RequestAuthContext,
  TeamListResponse,
} from '@einsatzpilot/types';

import { PrismaService } from '../prisma/prisma.service';
import {
  mapCompanyMemberItem,
  mapJobDetailResponse,
  mapJobListItem,
  mapTeamListItem,
} from './operations-mapper';
import { OperationsLookupService } from './operations-lookup.service';
import {
  assertCanReadCompanyArtifacts,
  assertCanReadMasterData,
} from './operations-permissions';
import {
  mapWorkdaySheetListItem,
  workdaySheetListInclude,
} from '../workday-sheets/workday-sheet-mapper';

const jobListInclude = {
  team: true,
  customer: true,
  address: true,
  object: true,
  objectArea: true,
} as const;

function localCalendarDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function emptyJobCounts(): DashboardJobStatusCounts {
  return {
    total: 0,
    planned: 0,
    inProgress: 0,
    done: 0,
    canceled: 0,
  };
}

function emptyWorkdaySheetCounts(): DashboardWorkdaySheetStatusCounts {
  return {
    total: 0,
    draft: 0,
    sent: 0,
    submitted: 0,
    reviewed: 0,
    archived: 0,
  };
}

@Injectable()
export class OperationsService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(OperationsLookupService)
    private readonly operationsLookupService: OperationsLookupService,
  ) {}

  async getDashboard(input: {
    companyId: string;
    actor: AuthenticatedUser;
    authContext: RequestAuthContext;
  }): Promise<DashboardResponse> {
    assertCanReadCompanyArtifacts(input.authContext);

    const isWorker =
      input.authContext.isAuthenticated && input.authContext.membershipRole === 'WORKER';
    const now = new Date();
    const today = localCalendarDate(now);
    const todayDate = new Date(`${today}T00:00:00.000Z`);
    const jobWhere = isWorker
      ? await this.workerJobWhere(input.companyId, input.actor.id)
      : { companyId: input.companyId };
    const workdaySheetWhere: Prisma.WorkdaySheetWhereInput = isWorker
      ? {
          companyId: input.companyId,
          date: todayDate,
          status: { in: ['SENT', 'SUBMITTED', 'REVIEWED', 'ARCHIVED'] },
          OR: [
            { workerUserId: input.actor.id },
            { team: { members: { some: { userId: input.actor.id } } } },
          ],
        }
      : { companyId: input.companyId, date: todayDate };

    const [jobGroups, actionableJobs, workdaySheets, office] = await Promise.all([
      this.prisma.job.groupBy({
        by: ['status'],
        where: jobWhere,
        _count: { _all: true },
      }),
      this.prisma.job.findMany({
        where: {
          AND: [jobWhere, { status: { in: ['PLANNED', 'IN_PROGRESS'] } }],
        },
        include: jobListInclude,
        orderBy: [{ status: 'asc' }, { scheduledStart: 'asc' }, { createdAt: 'asc' }],
        take: 6,
      }),
      this.prisma.workdaySheet.findMany({
        where: workdaySheetWhere,
        include: workdaySheetListInclude,
        orderBy: [{ createdAt: 'asc' }],
      }),
      isWorker ? Promise.resolve(undefined) : this.getOfficeDashboard(input.companyId, now),
    ]);

    const jobCounts = emptyJobCounts();
    for (const group of jobGroups) {
      jobCounts.total += group._count._all;
      if (group.status === 'PLANNED') jobCounts.planned = group._count._all;
      if (group.status === 'IN_PROGRESS') jobCounts.inProgress = group._count._all;
      if (group.status === 'DONE') jobCounts.done = group._count._all;
      if (group.status === 'CANCELED') jobCounts.canceled = group._count._all;
    }

    const sheetCounts = emptyWorkdaySheetCounts();
    let totalRows = 0;
    let completedRows = 0;
    for (const sheet of workdaySheets) {
      sheetCounts.total += 1;
      if (sheet.status === 'DRAFT') sheetCounts.draft += 1;
      if (sheet.status === 'SENT') sheetCounts.sent += 1;
      if (sheet.status === 'SUBMITTED') sheetCounts.submitted += 1;
      if (sheet.status === 'REVIEWED') sheetCounts.reviewed += 1;
      if (sheet.status === 'ARCHIVED') sheetCounts.archived += 1;
      totalRows += sheet.rows.length;
      completedRows += sheet.rows.filter((row) => Boolean(row.actualText)).length;
    }

    return {
      generatedAt: now.toISOString(),
      audience: isWorker ? 'WORKER' : 'OFFICE',
      today: {
        date: today,
        scope: isWorker ? 'ASSIGNED_TO_ME' : 'COMPANY',
        counts: sheetCounts,
        totalRows,
        completedRows,
        workdaySheets: workdaySheets.map(mapWorkdaySheetListItem),
      },
      jobs: {
        scope: isWorker ? 'ASSIGNED_TO_ME' : 'COMPANY',
        counts: jobCounts,
        actionableJobs: actionableJobs.map(mapJobListItem),
      },
      ...(office ? { office } : {}),
    };
  }

  private async workerJobWhere(
    companyId: string,
    userId: string,
  ): Promise<Prisma.JobWhereInput> {
    const teamMemberships = await this.prisma.teamMember.findMany({
      where: { userId, team: { companyId } },
      select: { teamId: true },
    });
    const teamIds = teamMemberships.map((membership) => membership.teamId);
    const assignments = await this.prisma.assignment.findMany({
      where: {
        companyId,
        status: 'ACTIVE',
        targetType: 'JOB',
        OR: [
          { sourceType: 'USER', sourceId: userId },
          ...(teamIds.length > 0
            ? [{ sourceType: 'TEAM' as const, sourceId: { in: teamIds } }]
            : []),
        ],
      },
      select: { targetId: true },
    });
    const assignedJobIds = assignments.map((assignment) => assignment.targetId);
    const assignmentClauses: Prisma.JobWhereInput[] = [];
    if (teamIds.length > 0) assignmentClauses.push({ teamId: { in: teamIds } });
    if (assignedJobIds.length > 0) assignmentClauses.push({ id: { in: assignedJobIds } });

    return {
      companyId,
      ...(assignmentClauses.length > 0
        ? { OR: assignmentClauses }
        : { id: { in: [] as string[] } }),
    };
  }

  private async getOfficeDashboard(
    companyId: string,
    now: Date,
  ): Promise<DashboardOfficeOverview> {
    const periodStartDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const periodEndDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    const [
      jobReportsAwaitingReview,
      submittedWorkdaySheetsAwaitingReview,
      activeTeams,
      activeAssignments,
      activeServiceAgreementDefinitions,
      costGroups,
      recentActions,
    ] = await Promise.all([
      this.prisma.jobReport.count({
        where: {
          companyId,
          reviewStatus: { in: ['SUBMITTED', 'PENDING_REVIEW'] },
        },
      }),
      this.prisma.workdaySheet.count({
        where: { companyId, status: 'SUBMITTED' },
      }),
      this.prisma.team.count({ where: { companyId, status: 'ACTIVE' } }),
      this.prisma.assignment.count({ where: { companyId, status: 'ACTIVE' } }),
      this.prisma.serviceAgreement.count({ where: { companyId, status: 'ACTIVE' } }),
      this.prisma.jobCostLine.groupBy({
        by: ['currency'],
        where: {
          companyId,
          costDate: { gte: periodStartDate, lt: periodEndDate },
        },
        _sum: { totalCost: true },
        orderBy: { currency: 'asc' },
      }),
      this.prisma.worksheetReviewAction.findMany({
        where: { companyId, status: 'COMPLETED' },
        select: {
          id: true,
          type: true,
          completedAt: true,
          sourceSheet: {
            select: { id: true, date: true, title: true },
          },
          sourceRow: {
            select: {
              id: true,
              position: true,
              plannedText: true,
              actualText: true,
            },
          },
          destinationJob: {
            select: { id: true, reference: true, title: true },
          },
          createdBy: {
            select: { id: true, email: true, displayName: true },
          },
        },
        orderBy: [{ completedAt: 'desc' }, { createdAt: 'desc' }],
        take: 6,
      }),
    ]);

    return {
      reviewQueue: {
        jobReportsAwaitingReview,
        submittedWorkdaySheetsAwaitingReview,
      },
      workforce: {
        activeTeams,
        activeAssignments,
      },
      activeServiceAgreementDefinitions,
      currentMonthCosts: {
        periodStart: periodStartDate.toISOString(),
        periodEndExclusive: periodEndDate.toISOString(),
        timeZone: 'UTC',
        totals: costGroups.map((group) => ({
          currency: group.currency,
          amount: Number(group._sum.totalCost ?? 0),
        })),
      },
      recentFollowUpActivity: recentActions.map((action) => ({
        id: action.id,
        type: action.type,
        completedAt: action.completedAt.toISOString(),
        sourceSheet: {
          id: action.sourceSheet.id,
          date: action.sourceSheet.date.toISOString().slice(0, 10),
          ...(action.sourceSheet.title ? { title: action.sourceSheet.title } : {}),
        },
        sourceRow: {
          id: action.sourceRow.id,
          position: action.sourceRow.position,
          plannedText: action.sourceRow.plannedText,
          ...(action.sourceRow.actualText
            ? { actualText: action.sourceRow.actualText }
            : {}),
        },
        destinationJob: action.destinationJob,
        createdBy: {
          id: action.createdBy.id,
          name: action.createdBy.displayName ?? action.createdBy.email,
          email: action.createdBy.email,
        },
      })),
    };
  }

  async getJobs(companyId: string): Promise<JobListResponse> {
    const jobs = await this.prisma.job.findMany({
      where: { companyId },
      include: jobListInclude,
      orderBy: [{ scheduledStart: 'asc' }, { createdAt: 'desc' }],
    });

    return {
      jobs: jobs.map((job) => mapJobListItem(job)),
    };
  }

  async getJobDetail(companyId: string, jobId: string) {
    const job = await this.operationsLookupService.getJobForCompanyOrThrow(companyId, jobId);

    return mapJobDetailResponse(job);
  }

  async getJobRelationOptions(
    companyId: string,
    authContext: RequestAuthContext,
  ): Promise<JobRelationOptionsResponse> {
    assertCanReadMasterData(authContext);
    return this.operationsLookupService.getJobRelationOptions(companyId);
  }

  async getTeams(companyId: string): Promise<TeamListResponse> {
    const teams = await this.prisma.team.findMany({
      where: {
        companyId,
      },
      include: {
        members: {
          include: {
            user: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return {
      teams: teams.map((team) => mapTeamListItem(team)),
    };
  }

  async getCompanyMembers(companyId: string): Promise<CompanyMemberListResponse> {
    const memberships = await this.prisma.membership.findMany({
      where: {
        companyId,
        isActive: true,
        user: {
          isActive: true,
        },
      },
      include: {
        user: true,
      },
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
    });

    return {
      members: memberships.map((membership) => mapCompanyMemberItem(membership)),
    };
  }
}
