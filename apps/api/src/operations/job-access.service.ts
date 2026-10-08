import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type { RequestAuthContext } from '@einsatzpilot/types';

import { PrismaService } from '../prisma/prisma.service';

const readableWorksheetStatuses = ['SENT', 'SUBMITTED', 'REVIEWED', 'ARCHIVED'] as const;
const writableWorksheetStatuses = ['SENT'] as const;

@Injectable()
export class JobAccessService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  private async getWorkerTeamIds(companyId: string, userId: string) {
    const memberships = await this.prisma.teamMember.findMany({
      where: { userId, team: { companyId } },
      select: { teamId: true },
    });

    return memberships.map((membership) => membership.teamId);
  }

  async getWorkerJobWhere(input: {
    companyId: string;
    userId: string;
    worksheetAccess?: 'NONE' | 'READ' | 'CONTRIBUTE';
  }): Promise<Prisma.JobWhereInput> {
    const teamIds = await this.getWorkerTeamIds(input.companyId, input.userId);
    const assignments = await this.prisma.assignment.findMany({
      where: {
        companyId: input.companyId,
        status: 'ACTIVE',
        targetType: 'JOB',
        OR: [
          { sourceType: 'USER', sourceId: input.userId },
          ...(teamIds.length > 0
            ? [{ sourceType: 'TEAM' as const, sourceId: { in: teamIds } }]
            : []),
        ],
      },
      select: { targetId: true },
    });
    const assignedJobIds = assignments.map((assignment) => assignment.targetId);
    const accessClauses: Prisma.JobWhereInput[] = [];

    if (teamIds.length > 0) {
      accessClauses.push({ teamId: { in: teamIds } });
    }
    if (assignedJobIds.length > 0) {
      accessClauses.push({ id: { in: assignedJobIds } });
    }

    if (input.worksheetAccess && input.worksheetAccess !== 'NONE') {
      const statuses =
        input.worksheetAccess === 'CONTRIBUTE'
          ? writableWorksheetStatuses
          : readableWorksheetStatuses;
      accessClauses.push({
        workdaySheetRows: {
          some: {
            companyId: input.companyId,
            sheet: {
              companyId: input.companyId,
              status: { in: [...statuses] },
              OR: [
                { workerUserId: input.userId },
                ...(teamIds.length > 0 ? [{ teamId: { in: teamIds } }] : []),
              ],
            },
          },
        },
      });
    }

    return {
      companyId: input.companyId,
      ...(accessClauses.length > 0
        ? { OR: accessClauses }
        : { id: { in: [] as string[] } }),
    };
  }

  async assertWorkerCanContributeToJob(input: {
    companyId: string;
    jobId: string;
    userId: string;
    authContext: RequestAuthContext;
  }) {
    if (!input.authContext.isAuthenticated || input.authContext.membershipRole !== 'WORKER') {
      return;
    }

    const workerWhere = await this.getWorkerJobWhere({
      companyId: input.companyId,
      userId: input.userId,
      worksheetAccess: 'CONTRIBUTE',
    });
    const accessibleJob = await this.prisma.job.findFirst({
      where: { AND: [{ id: input.jobId }, workerWhere] },
      select: { id: true },
    });

    if (!accessibleJob) {
      throw new ForbiddenException(
        'WORKER duerfen Rueckmeldungen und Nachweise nur fuer zugewiesene Auftraege oder fuer Auftraege eines gesendeten Tageszettels erfassen.',
      );
    }
  }

  async assertWorkerCanReadJob(input: {
    companyId: string;
    jobId: string;
    userId: string;
    authContext: RequestAuthContext;
  }) {
    if (!input.authContext.isAuthenticated || input.authContext.membershipRole !== 'WORKER') {
      return;
    }

    const workerWhere = await this.getWorkerJobWhere({
      companyId: input.companyId,
      userId: input.userId,
      worksheetAccess: 'READ',
    });
    const accessibleJob = await this.prisma.job.findFirst({
      where: { AND: [{ id: input.jobId }, workerWhere] },
      select: { id: true },
    });

    if (!accessibleJob) {
      throw new NotFoundException('Auftrag nicht gefunden.');
    }
  }
}
