import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type {
  AssignmentCreateInput,
  AssignmentDetailResponse,
  AssignmentEntityOptionsResponse,
  AssignmentListResponse,
  AssignmentUpdateInput,
  AuthenticatedUser,
  RequestAuthContext,
} from '@einsatzpilot/types';

import {
  assertCanReadAssignments,
  assertCanWriteAssignments,
} from '../operations/operations-permissions';
import { PrismaService } from '../prisma/prisma.service';
import { AssignmentEntityResolverService } from './assignment-entity-resolver.service';
import {
  assertValidAssignmentTimeRange,
  normalizeAssignmentCreateInput,
  normalizeAssignmentUpdateInput,
} from './assignment-payloads';
import { assertAssignmentStatusTransition } from './assignment-status-rules';
import { mapAssignmentListItem } from './assignments-mapper';

const assignmentInclude = {
  createdBy: {
    select: {
      id: true,
      email: true,
      displayName: true,
    },
  },
} as const;

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

@Injectable()
export class AssignmentsService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(AssignmentEntityResolverService)
    private readonly entityResolver: AssignmentEntityResolverService,
  ) {}

  private async getAssignmentForCompanyOrThrow(companyId: string, assignmentId: string) {
    const assignment = await this.prisma.assignment.findFirst({
      where: { id: assignmentId, companyId },
      include: assignmentInclude,
    });

    if (!assignment) {
      throw new NotFoundException('Zuweisung wurde in der aktiven Firma nicht gefunden.');
    }

    return assignment;
  }

  private async assertNoActiveDuplicate(input: {
    companyId: string;
    sourceType: AssignmentCreateInput['sourceType'];
    sourceId: string;
    targetType: AssignmentCreateInput['targetType'];
    targetId: string;
    kind: AssignmentCreateInput['kind'];
    excludeAssignmentId?: string;
  }) {
    const duplicate = await this.prisma.assignment.findFirst({
      where: {
        companyId: input.companyId,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        targetType: input.targetType,
        targetId: input.targetId,
        kind: input.kind,
        status: 'ACTIVE',
        id: input.excludeAssignmentId ? { not: input.excludeAssignmentId } : undefined,
      },
      select: { id: true },
    });

    if (duplicate) {
      throw new ConflictException(
        'Eine aktive Zuweisung fuer dieselbe Quelle, dasselbe Ziel und dieselbe Art existiert bereits.',
      );
    }
  }

  private async mapWithCurrentEntities(
    companyId: string,
    assignment: Parameters<typeof mapAssignmentListItem>[0],
  ) {
    const options = await this.entityResolver.getEntityOptions(companyId);
    const entityMap = this.entityResolver.buildEntityMap(options);
    return mapAssignmentListItem(
      assignment,
      this.entityResolver.getEntityFromMap(entityMap, assignment.sourceType, assignment.sourceId),
      this.entityResolver.getEntityFromMap(entityMap, assignment.targetType, assignment.targetId),
    );
  }

  async getEntityOptions(input: {
    companyId: string;
    authContext: RequestAuthContext;
  }): Promise<AssignmentEntityOptionsResponse> {
    assertCanReadAssignments(input.authContext);
    return this.entityResolver.getEntityOptions(input.companyId);
  }

  async getAssignments(input: {
    companyId: string;
    authContext: RequestAuthContext;
  }): Promise<AssignmentListResponse> {
    assertCanReadAssignments(input.authContext);
    const [assignments, options] = await Promise.all([
      this.prisma.assignment.findMany({
        where: { companyId: input.companyId },
        include: assignmentInclude,
        orderBy: [{ status: 'asc' }, { startsAt: 'asc' }, { createdAt: 'desc' }],
      }),
      this.entityResolver.getEntityOptions(input.companyId),
    ]);
    const entityMap = this.entityResolver.buildEntityMap(options);

    return {
      assignments: assignments.map((assignment) =>
        mapAssignmentListItem(
          assignment,
          this.entityResolver.getEntityFromMap(
            entityMap,
            assignment.sourceType,
            assignment.sourceId,
          ),
          this.entityResolver.getEntityFromMap(
            entityMap,
            assignment.targetType,
            assignment.targetId,
          ),
        ),
      ),
    };
  }

  async getAssignmentDetail(input: {
    companyId: string;
    assignmentId: string;
    authContext: RequestAuthContext;
  }): Promise<AssignmentDetailResponse> {
    assertCanReadAssignments(input.authContext);
    const assignment = await this.getAssignmentForCompanyOrThrow(
      input.companyId,
      input.assignmentId,
    );
    return { assignment: await this.mapWithCurrentEntities(input.companyId, assignment) };
  }

  async createAssignment(input: {
    companyId: string;
    actor: AuthenticatedUser;
    authContext: RequestAuthContext;
    payload: AssignmentCreateInput;
  }) {
    assertCanWriteAssignments(input.authContext);
    const payload = normalizeAssignmentCreateInput(input.payload);
    const [source, target] = await Promise.all([
      this.entityResolver.getEntityForCompanyOrThrow(
        input.companyId,
        payload.sourceType,
        payload.sourceId,
        'source',
      ),
      this.entityResolver.getEntityForCompanyOrThrow(
        input.companyId,
        payload.targetType,
        payload.targetId,
        'target',
      ),
    ]);

    if (payload.status === 'ACTIVE') {
      await this.assertNoActiveDuplicate({ companyId: input.companyId, ...payload });
    }

    try {
      const assignment = await this.prisma.assignment.create({
        data: {
          companyId: input.companyId,
          createdByUserId: input.actor.id,
          ...payload,
        },
        include: assignmentInclude,
      });

      return mapAssignmentListItem(assignment, source, target);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException(
          'Eine aktive Zuweisung fuer dieselbe Quelle, dasselbe Ziel und dieselbe Art existiert bereits.',
        );
      }
      throw error;
    }
  }

  async updateAssignment(input: {
    companyId: string;
    assignmentId: string;
    authContext: RequestAuthContext;
    payload: AssignmentUpdateInput;
  }) {
    assertCanWriteAssignments(input.authContext);
    const payload = normalizeAssignmentUpdateInput(input.payload);
    const assignment = await this.getAssignmentForCompanyOrThrow(
      input.companyId,
      input.assignmentId,
    );
    const [source, target] = await Promise.all([
      this.entityResolver.getEntityForCompanyOrThrow(
        input.companyId,
        assignment.sourceType,
        assignment.sourceId,
        'source',
      ),
      this.entityResolver.getEntityForCompanyOrThrow(
        input.companyId,
        assignment.targetType,
        assignment.targetId,
        'target',
      ),
    ]);
    const status = payload.status ?? assignment.status;
    const startsAt =
      payload.startsAt === undefined ? assignment.startsAt : payload.startsAt;
    const endsAt = payload.endsAt === undefined ? assignment.endsAt : payload.endsAt;

    assertAssignmentStatusTransition(assignment.status, status);
    assertValidAssignmentTimeRange(startsAt, endsAt);

    if (status === 'ACTIVE' && assignment.status !== 'ACTIVE') {
      await this.assertNoActiveDuplicate({
        companyId: input.companyId,
        sourceType: assignment.sourceType,
        sourceId: assignment.sourceId,
        targetType: assignment.targetType,
        targetId: assignment.targetId,
        kind: assignment.kind,
        excludeAssignmentId: assignment.id,
      });
    }

    try {
      const updated = await this.prisma.assignment.update({
        where: { id: assignment.id },
        data: payload,
        include: assignmentInclude,
      });

      return mapAssignmentListItem(updated, source, target);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException(
          'Eine aktive Zuweisung fuer dieselbe Quelle, dasselbe Ziel und dieselbe Art existiert bereits.',
        );
      }
      throw error;
    }
  }
}
