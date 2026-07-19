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
  buildJobRelationChangedActivities,
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

  async resolveJobRelations(
    companyId: string,
    relationIds: {
      customerId?: string | null;
      addressId?: string | null;
      objectId?: string | null;
      objectAreaId?: string | null;
    },
  ) {
    if (relationIds.objectAreaId && !relationIds.objectId) {
      throw new BadRequestException('objectAreaId erfordert ein ausgewaehltes objectId.');
    }

    const [customer, address, object, objectArea] = await Promise.all([
      relationIds.customerId
        ? this.operationsLookupService.getCustomerForCompanyOrThrow(
            companyId,
            relationIds.customerId,
          )
        : null,
      relationIds.addressId
        ? this.operationsLookupService.getAddressForCompanyOrThrow(companyId, relationIds.addressId)
        : null,
      relationIds.objectId
        ? this.operationsLookupService.getObjectForCompanyOrThrow(companyId, relationIds.objectId)
        : null,
      relationIds.objectAreaId
        ? this.operationsLookupService.getObjectAreaForCompanyOrThrow(
            companyId,
            relationIds.objectAreaId,
          )
        : null,
    ]);

    if (objectArea && object && objectArea.objectId !== object.id) {
      throw new BadRequestException(
        'Der Objektbereich gehoert nicht zum ausgewaehlten Objekt.',
      );
    }

    return { customer, address, object, objectArea };
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
    const relations = await this.resolveJobRelations(input.companyId, payload);

    const reference = createJobReference();
    const job = await this.prisma.job.create({
      data: {
        companyId: input.companyId,
        teamId: payload.teamId,
        customerId: relations.customer?.id,
        addressId: relations.address?.id,
        objectId: relations.object?.id,
        objectAreaId: relations.objectArea?.id,
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
      ...buildJobRelationChangedActivities({
        actor: input.actor,
        changes: [
          {
            relationLabel: 'Kundenverknuepfung',
            next: relations.customer
              ? { id: relations.customer.id, label: relations.customer.name }
              : undefined,
          },
          {
            relationLabel: 'Adressverknuepfung',
            next: relations.address
              ? {
                  id: relations.address.id,
                  label: `${relations.address.label}, ${relations.address.street}, ${relations.address.postalCode} ${relations.address.city}`,
                }
              : undefined,
          },
          {
            relationLabel: 'Objektverknuepfung',
            next: relations.object
              ? { id: relations.object.id, label: relations.object.name }
              : undefined,
          },
          {
            relationLabel: 'Objektbereichsverknuepfung',
            next: relations.objectArea
              ? { id: relations.objectArea.id, label: relations.objectArea.name }
              : undefined,
          },
        ],
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

    if (payload.objectAreaId && payload.objectId === undefined) {
      throw new BadRequestException(
        'objectAreaId kann nur zusammen mit objectId aktualisiert werden.',
      );
    }

    const nextTeam =
      payload.teamId === undefined
        ? existingJob.team
        : payload.teamId === null
          ? null
          : await this.assertOptionalTeamBelongsToCompany(input.companyId, payload.teamId);
    const nextRelations = await this.resolveJobRelations(input.companyId, {
      customerId:
        payload.customerId === undefined ? existingJob.customerId : payload.customerId,
      addressId: payload.addressId === undefined ? existingJob.addressId : payload.addressId,
      objectId: payload.objectId === undefined ? existingJob.objectId : payload.objectId,
      objectAreaId:
        payload.objectAreaId === undefined ? existingJob.objectAreaId : payload.objectAreaId,
    });

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
        customerId:
          payload.customerId === undefined ? undefined : (nextRelations.customer?.id ?? null),
        addressId:
          payload.addressId === undefined ? undefined : (nextRelations.address?.id ?? null),
        objectId:
          payload.objectId === undefined ? undefined : (nextRelations.object?.id ?? null),
        objectAreaId:
          payload.objectAreaId === undefined
            ? undefined
            : (nextRelations.objectArea?.id ?? null),
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

    activities.push(
      ...buildJobRelationChangedActivities({
        actor: input.actor,
        changes: [
          {
            relationLabel: 'Kundenverknuepfung',
            previous: existingJob.customer
              ? { id: existingJob.customer.id, label: existingJob.customer.name }
              : undefined,
            next: nextRelations.customer
              ? { id: nextRelations.customer.id, label: nextRelations.customer.name }
              : undefined,
          },
          {
            relationLabel: 'Adressverknuepfung',
            previous: existingJob.address
              ? {
                  id: existingJob.address.id,
                  label: `${existingJob.address.label}, ${existingJob.address.street}, ${existingJob.address.postalCode} ${existingJob.address.city}`,
                }
              : undefined,
            next: nextRelations.address
              ? {
                  id: nextRelations.address.id,
                  label: `${nextRelations.address.label}, ${nextRelations.address.street}, ${nextRelations.address.postalCode} ${nextRelations.address.city}`,
                }
              : undefined,
          },
          {
            relationLabel: 'Objektverknuepfung',
            previous: existingJob.object
              ? { id: existingJob.object.id, label: existingJob.object.name }
              : undefined,
            next: nextRelations.object
              ? { id: nextRelations.object.id, label: nextRelations.object.name }
              : undefined,
          },
          {
            relationLabel: 'Objektbereichsverknuepfung',
            previous: existingJob.objectArea
              ? { id: existingJob.objectArea.id, label: existingJob.objectArea.name }
              : undefined,
            next: nextRelations.objectArea
              ? { id: nextRelations.objectArea.id, label: nextRelations.objectArea.name }
              : undefined,
          },
        ],
      }),
    );

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
