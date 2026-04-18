import { Inject, Injectable } from '@nestjs/common';
import { JobStatus as PrismaJobStatus } from '@prisma/client';

import type {
  CompanyMemberListResponse,
  DashboardResponse,
  JobListResponse,
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

@Injectable()
export class OperationsService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(OperationsLookupService)
    private readonly operationsLookupService: OperationsLookupService,
  ) {}

  async getDashboard(companyId: string): Promise<DashboardResponse> {
    const [jobs, teams] = await Promise.all([
      this.prisma.job.findMany({
        where: { companyId },
        include: {
          team: true,
        },
        orderBy: [{ status: 'asc' }, { scheduledStart: 'asc' }],
        take: 4,
      }),
      this.prisma.team.findMany({
        where: { companyId },
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
      }),
    ]);

    const totalJobs = await this.prisma.job.count({ where: { companyId } });
    const scheduledJobs = await this.prisma.job.count({
      where: { companyId, status: PrismaJobStatus.PLANNED },
    });
    const inProgressJobs = await this.prisma.job.count({
      where: { companyId, status: 'IN_PROGRESS' },
    });
    const completedJobs = await this.prisma.job.count({ where: { companyId, status: 'DONE' } });

    return {
      summary: {
        totalJobs,
        scheduledJobs,
        inProgressJobs,
        completedJobs,
        activeTeams: teams.filter((team) => team.status === 'ACTIVE').length,
      },
      highlightedJobs: jobs.map((job) => mapJobListItem(job)),
      teams: teams.map((team) => mapTeamListItem(team)),
    };
  }

  async getJobs(companyId: string): Promise<JobListResponse> {
    const jobs = await this.prisma.job.findMany({
      where: { companyId },
      include: {
        team: true,
      },
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
