import { Inject, Injectable } from '@nestjs/common';

import type { JobActivityKind } from '@prisma/client';

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { JobStatus as PrismaJobStatus } from '@prisma/client';

import type {
  AuthenticatedUser,
  JobCreateInput,
  JobStatusTransitionInput,
  JobUpdateInput,
  RequestAuthContext,
  TeamCreateInput,
  TeamMemberAddInput,
  TeamMemberRemoveInput,
  TeamUpdateInput,
} from '@einsatzpilot/types';

import { PrismaService } from '../prisma/prisma.service';
import {
  buildJobCreatedActivity,
  buildJobStatusChangedActivity,
  buildJobUpdatedActivities,
} from './job-activity-rules';
import { assertValidJobStatusTransition } from './job-status-rules';
import { mapJobDetailResponse, mapTeamListItem } from './operations-mapper';
import { OperationsLookupService } from './operations-lookup.service';
import {
  normalizeJobCreateInput,
  normalizeJobStatusTransitionInput,
  normalizeJobUpdateInput,
  normalizeTeamCreateInput,
  normalizeTeamUpdateInput,
} from './operations-payloads';
import { assertCanWriteJobs, assertCanWriteTeams } from './operations-permissions';
import { createJobReference } from './operations-reference';

type JobActivityDraft = {
  kind: JobActivityKind;
  title: string;
  content?: string;
  authorName?: string;
};

@Injectable()
export class OperationsWriteService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(OperationsLookupService)
    private readonly operationsLookupService: OperationsLookupService,
  ) {}

  assertJobWriteAccess(authContext: RequestAuthContext) {
    assertCanWriteJobs(authContext);
  }

  assertTeamWriteAccess(authContext: RequestAuthContext) {
    assertCanWriteTeams(authContext);
  }

  async assertOptionalTeamBelongsToCompany(companyId: string, teamId?: string | null) {
    if (!teamId) {
      return null;
    }

    return this.operationsLookupService.getTeamForCompanyOrThrow(companyId, teamId);
  }

  async createJobActivities(jobId: string, activities: JobActivityDraft[]) {
    if (activities.length === 0) {
      return;
    }

    await this.prisma.jobActivity.createMany({
      data: activities.map((activity) => ({
        jobId,
        kind: activity.kind,
        title: activity.title,
        content: activity.content,
        authorName: activity.authorName,
      })),
    });
  }

  async createJob(input: {
    companyId: string;
    actor: AuthenticatedUser;
    authContext: RequestAuthContext;
    payload: JobCreateInput;
  }) {
    this.assertJobWriteAccess(input.authContext);

    const payload = normalizeJobCreateInput(input.payload);
    await this.assertOptionalTeamBelongsToCompany(input.companyId, payload.teamId);

    const reference = createJobReference();
    const job = await this.prisma.job.create({
      data: {
        companyId: input.companyId,
        teamId: payload.teamId,
        reference,
        title: payload.title,
        description: payload.description,
        customerName: payload.customerName,
        location: payload.location,
        scheduledStart: payload.scheduledStart,
        scheduledEnd: payload.scheduledEnd,
        priority: payload.priority,
        status: PrismaJobStatus.PLANNED,
      },
    });

    await this.createJobActivities(job.id, [
      buildJobCreatedActivity({
        actor: input.actor,
        reference,
        title: payload.title,
      }),
    ]);

    const hydratedJob = await this.operationsLookupService.getJobForCompanyOrThrow(
      input.companyId,
      job.id,
    );

    return mapJobDetailResponse(hydratedJob);
  }

  async updateJob(input: {
    companyId: string;
    jobId: string;
    actor: AuthenticatedUser;
    authContext: RequestAuthContext;
    payload: JobUpdateInput;
  }) {
    this.assertJobWriteAccess(input.authContext);

    const payload = normalizeJobUpdateInput(input.payload);
    const existingJob = await this.operationsLookupService.getJobForCompanyOrThrow(
      input.companyId,
      input.jobId,
    );

    const nextTeam =
      payload.teamId === undefined
        ? existingJob.team
        : payload.teamId === null
          ? null
          : await this.assertOptionalTeamBelongsToCompany(input.companyId, payload.teamId);

    await this.prisma.job.update({
      where: {
        id: existingJob.id,
      },
      data: {
        title: payload.title,
        description: payload.description,
        customerName: payload.customerName,
        location: payload.location,
        scheduledStart: payload.scheduledStart,
        scheduledEnd: payload.scheduledEnd,
        priority: payload.priority,
        teamId:
          payload.teamId === undefined
            ? undefined
            : payload.teamId === null
              ? null
              : nextTeam?.id,
      },
    });

    const activities = buildJobUpdatedActivities({
      actor: input.actor,
      previousTeamName: existingJob.team?.name,
      nextTeamName:
        payload.teamId === undefined
          ? existingJob.team?.name
          : payload.teamId === null
            ? undefined
            : nextTeam?.name,
      previousScheduledStart: existingJob.scheduledStart,
      nextScheduledStart: payload.scheduledStart ?? existingJob.scheduledStart,
      previousScheduledEnd: existingJob.scheduledEnd,
      nextScheduledEnd:
        payload.scheduledEnd === undefined ? existingJob.scheduledEnd : payload.scheduledEnd,
      previousPriority: existingJob.priority,
      nextPriority: payload.priority ?? existingJob.priority,
      previousTitle: existingJob.title,
      nextTitle: payload.title ?? existingJob.title,
    });

    await this.createJobActivities(existingJob.id, activities);

    const hydratedJob = await this.operationsLookupService.getJobForCompanyOrThrow(
      input.companyId,
      existingJob.id,
    );

    return mapJobDetailResponse(hydratedJob);
  }

  async transitionJobStatus(input: {
    companyId: string;
    jobId: string;
    actor: AuthenticatedUser;
    authContext: RequestAuthContext;
    payload: JobStatusTransitionInput;
  }) {
    this.assertJobWriteAccess(input.authContext);

    const payload = normalizeJobStatusTransitionInput(input.payload);
    const existingJob = await this.operationsLookupService.getJobForCompanyOrThrow(
      input.companyId,
      input.jobId,
    );

    assertValidJobStatusTransition({
      from: existingJob.status,
      to: payload.status,
      authContext: input.authContext,
    });

    await this.prisma.job.update({
      where: {
        id: existingJob.id,
      },
      data: {
        status: payload.status as PrismaJobStatus,
      },
    });

    await this.createJobActivities(existingJob.id, [
      buildJobStatusChangedActivity({
        actor: input.actor,
        from: existingJob.status,
        to: payload.status,
      }),
    ]);

    const hydratedJob = await this.operationsLookupService.getJobForCompanyOrThrow(
      input.companyId,
      existingJob.id,
    );

    return mapJobDetailResponse(hydratedJob);
  }

  async createTeam(input: {
    companyId: string;
    authContext: RequestAuthContext;
    payload: TeamCreateInput;
  }) {
    this.assertTeamWriteAccess(input.authContext);
    const payload = normalizeTeamCreateInput(input.payload);

    const team = await this.prisma.team.create({
      data: {
        companyId: input.companyId,
        name: payload.name,
        code: payload.code,
        specialty: payload.specialty,
        status: payload.status,
        currentAssignment: payload.currentAssignment,
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
    });

    return mapTeamListItem(team);
  }

  async updateTeam(input: {
    companyId: string;
    teamId: string;
    authContext: RequestAuthContext;
    payload: TeamUpdateInput;
  }) {
    this.assertTeamWriteAccess(input.authContext);
    const payload = normalizeTeamUpdateInput(input.payload);
    const existingTeam = await this.operationsLookupService.getTeamForCompanyOrThrow(
      input.companyId,
      input.teamId,
    );

    const team = await this.prisma.team.update({
      where: {
        id: existingTeam.id,
      },
      data: {
        name: payload.name,
        code: payload.code,
        specialty: payload.specialty,
        status: payload.status,
        currentAssignment: payload.currentAssignment,
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
    });

    return mapTeamListItem(team);
  }

  async addTeamMember(input: {
    companyId: string;
    teamId: string;
    authContext: RequestAuthContext;
    payload: TeamMemberAddInput;
  }) {
    this.assertTeamWriteAccess(input.authContext);

    const team = await this.operationsLookupService.getTeamForCompanyOrThrow(
      input.companyId,
      input.teamId,
    );

    const userId = input.payload.userId?.trim();

    if (!userId) {
      throw new BadRequestException('userId ist erforderlich.');
    }

    await this.operationsLookupService.getMembershipForCompanyUserOrThrow(input.companyId, userId);

    await this.prisma.teamMember.upsert({
      where: {
        teamId_userId: {
          teamId: team.id,
          userId,
        },
      },
      create: {
        teamId: team.id,
        userId,
        roleLabel: input.payload.roleLabel?.trim() || undefined,
      },
      update: {
        roleLabel: input.payload.roleLabel?.trim() || undefined,
      },
    });

    const hydratedTeam = await this.operationsLookupService.getTeamForCompanyOrThrow(
      input.companyId,
      team.id,
    );

    return mapTeamListItem(hydratedTeam);
  }

  async removeTeamMember(input: {
    companyId: string;
    teamId: string;
    authContext: RequestAuthContext;
    payload: TeamMemberRemoveInput;
  }) {
    this.assertTeamWriteAccess(input.authContext);

    const team = await this.operationsLookupService.getTeamForCompanyOrThrow(
      input.companyId,
      input.teamId,
    );
    const userId = input.payload.userId?.trim();

    if (!userId) {
      throw new BadRequestException('userId ist erforderlich.');
    }

    const existingMember = await this.prisma.teamMember.findFirst({
      where: {
        teamId: team.id,
        userId,
      },
    });

    if (!existingMember) {
      throw new NotFoundException('Teammitglied nicht gefunden.');
    }

    await this.prisma.teamMember.delete({
      where: {
        id: existingMember.id,
      },
    });

    const hydratedTeam = await this.operationsLookupService.getTeamForCompanyOrThrow(
      input.companyId,
      team.id,
    );

    return mapTeamListItem(hydratedTeam);
  }
}
