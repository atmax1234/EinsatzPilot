import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type {
  AuthenticatedUser,
  RequestAuthContext,
  WorkdaySheetCreateInput,
  WorkdaySheetDetailResponse,
  WorkdaySheetListResponse,
  WorkdaySheetOptionsResponse,
  WorkdaySheetRowCreateInput,
  WorkdaySheetRowUpdateInput,
  WorkdaySheetStatusUpdateInput,
  WorkdaySheetUpdateInput,
} from '@einsatzpilot/types';

import { OperationsLookupService } from '../operations/operations-lookup.service';
import {
  assertCanManageWorkdaySheets,
  assertCanReadWorkdaySheets,
} from '../operations/operations-permissions';
import { PrismaService } from '../prisma/prisma.service';
import {
  mapWorkdaySheetDetail,
  mapWorkdaySheetListItem,
  workdaySheetInclude,
  type WorkdaySheetRecord,
} from './workday-sheet-mapper';
import {
  assertWorkdaySheetRowTimeRange,
  normalizeWorkdaySheetCreateInput,
  normalizeWorkdaySheetRowActualUpdateInput,
  normalizeWorkdaySheetRowCreateInput,
  normalizeWorkdaySheetRowPlannedUpdateInput,
  normalizeWorkdaySheetStatusUpdateInput,
  normalizeWorkdaySheetUpdateInput,
} from './workday-sheet-payloads';
import { WorkdaySheetRelationsService } from './workday-sheet-relations.service';
import { assertWorkdaySheetStatusTransition } from './workday-sheet-status-rules';

function isOfficeRole(authContext: RequestAuthContext) {
  return (
    authContext.isAuthenticated &&
    (authContext.membershipRole === 'OWNER' || authContext.membershipRole === 'OFFICE')
  );
}

@Injectable()
export class WorkdaySheetsService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(OperationsLookupService)
    private readonly operationsLookupService: OperationsLookupService,
    @Inject(WorkdaySheetRelationsService)
    private readonly relationsService: WorkdaySheetRelationsService,
  ) {}

  private workerAccessWhere(companyId: string, userId: string): Prisma.WorkdaySheetWhereInput {
    return {
      companyId,
      status: { in: ['SENT', 'SUBMITTED', 'REVIEWED', 'ARCHIVED'] },
      OR: [
        { workerUserId: userId },
        {
          team: {
            members: {
              some: { userId },
            },
          },
        },
      ],
    };
  }

  private async getCompanySheetOrThrow(companyId: string, sheetId: string) {
    const sheet = await this.prisma.workdaySheet.findFirst({
      where: { id: sheetId, companyId },
      include: workdaySheetInclude,
    });
    if (!sheet) {
      throw new NotFoundException('Tagesblatt wurde in der aktiven Firma nicht gefunden.');
    }
    return sheet;
  }

  private async getReadableSheetOrThrow(input: {
    companyId: string;
    sheetId: string;
    actorUserId: string;
    authContext: RequestAuthContext;
  }) {
    assertCanReadWorkdaySheets(input.authContext);
    if (isOfficeRole(input.authContext)) {
      return this.getCompanySheetOrThrow(input.companyId, input.sheetId);
    }

    const sheet = await this.prisma.workdaySheet.findFirst({
      where: {
        id: input.sheetId,
        ...this.workerAccessWhere(input.companyId, input.actorUserId),
      },
      include: workdaySheetInclude,
    });
    if (!sheet) {
      throw new NotFoundException('Zugewiesenes Tagesblatt wurde nicht gefunden.');
    }
    return sheet;
  }

  private getRowOrThrow(sheet: WorkdaySheetRecord, rowId: string) {
    const row = sheet.rows.find((candidate) => candidate.id === rowId);
    if (!row) {
      throw new NotFoundException('Zeile wurde in diesem Tagesblatt nicht gefunden.');
    }
    return row;
  }

  private mapDetailForContext(
    sheet: WorkdaySheetRecord,
    authContext: RequestAuthContext,
  ): WorkdaySheetDetailResponse {
    const detail = mapWorkdaySheetDetail(sheet);
    if (!isOfficeRole(authContext)) {
      delete detail.workdaySheet.internalNotes;
    }
    return detail;
  }

  private async validateAssignees(
    companyId: string,
    input: { teamId?: string | null; workerUserId?: string | null },
  ) {
    const [team, workerMembership] = await Promise.all([
      input.teamId
        ? this.operationsLookupService.getTeamForCompanyOrThrow(companyId, input.teamId)
        : null,
      input.workerUserId
        ? this.operationsLookupService.getMembershipForCompanyUserOrThrow(
            companyId,
            input.workerUserId,
          )
        : null,
    ]);

    if (workerMembership && workerMembership.role !== 'WORKER') {
      throw new BadRequestException('workerUserId muss zu einer aktiven WORKER-Mitgliedschaft gehoeren.');
    }

    return { team, workerMembership };
  }

  async getWorkdaySheets(input: {
    companyId: string;
    actor: AuthenticatedUser;
    authContext: RequestAuthContext;
  }): Promise<WorkdaySheetListResponse> {
    assertCanReadWorkdaySheets(input.authContext);
    const where = isOfficeRole(input.authContext)
      ? { companyId: input.companyId }
      : this.workerAccessWhere(input.companyId, input.actor.id);
    const sheets = await this.prisma.workdaySheet.findMany({
      where,
      include: workdaySheetInclude,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
    return { workdaySheets: sheets.map(mapWorkdaySheetListItem) };
  }

  async getWorkdaySheetDetail(input: {
    companyId: string;
    sheetId: string;
    actor: AuthenticatedUser;
    authContext: RequestAuthContext;
  }): Promise<WorkdaySheetDetailResponse> {
    const sheet = await this.getReadableSheetOrThrow({
      companyId: input.companyId,
      sheetId: input.sheetId,
      actorUserId: input.actor.id,
      authContext: input.authContext,
    });
    return this.mapDetailForContext(sheet, input.authContext);
  }

  async getOptions(input: {
    companyId: string;
    authContext: RequestAuthContext;
  }): Promise<WorkdaySheetOptionsResponse> {
    assertCanManageWorkdaySheets(input.authContext);
    const [teams, memberships, customers, addresses, objects, objectAreas, jobs] =
      await Promise.all([
        this.prisma.team.findMany({
          where: { companyId: input.companyId, status: 'ACTIVE' },
          select: { id: true, name: true, _count: { select: { members: true } } },
          orderBy: { name: 'asc' },
        }),
        this.prisma.membership.findMany({
          where: {
            companyId: input.companyId,
            role: 'WORKER',
            isActive: true,
            user: { isActive: true },
          },
          select: { user: { select: { id: true, email: true, displayName: true } } },
          orderBy: { createdAt: 'asc' },
        }),
        this.prisma.customer.findMany({
          where: { companyId: input.companyId },
          select: { id: true, name: true },
          orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
        }),
        this.prisma.address.findMany({
          where: { companyId: input.companyId },
          select: {
            id: true,
            label: true,
            street: true,
            postalCode: true,
            city: true,
            country: true,
          },
          orderBy: [{ label: 'asc' }, { city: 'asc' }],
        }),
        this.prisma.object.findMany({
          where: { companyId: input.companyId },
          select: { id: true, name: true },
          orderBy: [{ status: 'asc' }, { name: 'asc' }],
        }),
        this.prisma.objectArea.findMany({
          where: { companyId: input.companyId },
          select: { id: true, objectId: true, name: true },
          orderBy: [{ objectId: 'asc' }, { name: 'asc' }],
        }),
        this.prisma.job.findMany({
          where: { companyId: input.companyId },
          select: { id: true, reference: true, title: true },
          orderBy: [{ scheduledStart: 'desc' }, { createdAt: 'desc' }],
          take: 250,
        }),
      ]);

    return {
      teams: teams.map((team) => ({
        id: team.id,
        name: team.name,
        memberCount: team._count.members,
      })),
      workers: memberships.map(({ user }) => ({
        id: user.id,
        name: user.displayName ?? user.email,
        email: user.email,
      })),
      customers,
      addresses,
      objects,
      objectAreas,
      jobs,
    };
  }

  async createWorkdaySheet(input: {
    companyId: string;
    actor: AuthenticatedUser;
    authContext: RequestAuthContext;
    payload: WorkdaySheetCreateInput;
  }): Promise<WorkdaySheetDetailResponse> {
    assertCanManageWorkdaySheets(input.authContext);
    const payload = normalizeWorkdaySheetCreateInput(input.payload);
    await this.validateAssignees(input.companyId, payload);
    await Promise.all(
      payload.rows.map((row) => this.relationsService.validateRowRelations(input.companyId, row)),
    );

    const sheet = await this.prisma.workdaySheet.create({
      data: {
        companyId: input.companyId,
        date: payload.date,
        title: payload.title,
        teamId: payload.teamId,
        workerUserId: payload.workerUserId,
        internalNotes: payload.internalNotes,
        createdByUserId: input.actor.id,
        rows: {
          create: payload.rows.map((row, position) => ({
            companyId: input.companyId,
            position,
            ...row,
          })),
        },
      },
      include: workdaySheetInclude,
    });
    return mapWorkdaySheetDetail(sheet);
  }

  async updateWorkdaySheet(input: {
    companyId: string;
    sheetId: string;
    authContext: RequestAuthContext;
    payload: WorkdaySheetUpdateInput;
  }): Promise<WorkdaySheetDetailResponse> {
    assertCanManageWorkdaySheets(input.authContext);
    const payload = normalizeWorkdaySheetUpdateInput(input.payload);
    const sheet = await this.getCompanySheetOrThrow(input.companyId, input.sheetId);
    if (sheet.status !== 'DRAFT') {
      throw new BadRequestException('Nur DRAFT-Tagesblaetter koennen geplant werden.');
    }
    await this.validateAssignees(input.companyId, {
      teamId: payload.teamId === undefined ? sheet.teamId : payload.teamId,
      workerUserId:
        payload.workerUserId === undefined ? sheet.workerUserId : payload.workerUserId,
    });

    const updated = await this.prisma.workdaySheet.update({
      where: { id: sheet.id },
      data: payload,
      include: workdaySheetInclude,
    });
    return mapWorkdaySheetDetail(updated);
  }

  async addWorkdaySheetRow(input: {
    companyId: string;
    sheetId: string;
    authContext: RequestAuthContext;
    payload: WorkdaySheetRowCreateInput;
  }): Promise<WorkdaySheetDetailResponse> {
    assertCanManageWorkdaySheets(input.authContext);
    const payload = normalizeWorkdaySheetRowCreateInput(input.payload);
    const sheet = await this.getCompanySheetOrThrow(input.companyId, input.sheetId);
    if (sheet.status !== 'DRAFT') {
      throw new BadRequestException('Geplante Zeilen koennen nur im DRAFT geaendert werden.');
    }
    if (sheet.rows.length >= 100) {
      throw new BadRequestException('Ein Tagesblatt darf hoechstens 100 Zeilen enthalten.');
    }
    await this.relationsService.validateRowRelations(input.companyId, payload);
    const nextPosition = sheet.rows.reduce((max, row) => Math.max(max, row.position), -1) + 1;
    await this.prisma.workdaySheetRow.create({
      data: {
        companyId: input.companyId,
        sheetId: sheet.id,
        position: nextPosition,
        ...payload,
      },
    });
    return mapWorkdaySheetDetail(
      await this.getCompanySheetOrThrow(input.companyId, input.sheetId),
    );
  }

  async updateWorkdaySheetRow(input: {
    companyId: string;
    sheetId: string;
    rowId: string;
    actor: AuthenticatedUser;
    authContext: RequestAuthContext;
    payload: WorkdaySheetRowUpdateInput;
  }): Promise<WorkdaySheetDetailResponse> {
    if (isOfficeRole(input.authContext)) {
      assertCanManageWorkdaySheets(input.authContext);
      const sheet = await this.getCompanySheetOrThrow(input.companyId, input.sheetId);
      if (sheet.status !== 'DRAFT') {
        throw new BadRequestException('Geplante Zeilen koennen nur im DRAFT geaendert werden.');
      }
      const row = this.getRowOrThrow(sheet, input.rowId);
      const payload = normalizeWorkdaySheetRowPlannedUpdateInput(input.payload);
      const relations = this.relationsService.mergeRowRelations(
        {
          customerId: row.customerId ?? undefined,
          addressId: row.addressId ?? undefined,
          objectId: row.objectId ?? undefined,
          objectAreaId: row.objectAreaId ?? undefined,
          jobId: row.jobId ?? undefined,
        },
        payload,
      );
      await this.relationsService.validateRowRelations(input.companyId, relations);
      const startTime = payload.startTime === undefined ? row.startTime : payload.startTime;
      const endTime = payload.endTime === undefined ? row.endTime : payload.endTime;
      assertWorkdaySheetRowTimeRange(startTime, endTime);
      await this.prisma.workdaySheetRow.update({ where: { id: row.id }, data: payload });
      return mapWorkdaySheetDetail(
        await this.getCompanySheetOrThrow(input.companyId, input.sheetId),
      );
    }

    const sheet = await this.getReadableSheetOrThrow({
      companyId: input.companyId,
      sheetId: input.sheetId,
      actorUserId: input.actor.id,
      authContext: input.authContext,
    });
    if (sheet.status !== 'SENT') {
      throw new BadRequestException('Ist-Arbeit kann nur in einem SENT-Tagesblatt erfasst werden.');
    }
    const row = this.getRowOrThrow(sheet, input.rowId);
    const payload = normalizeWorkdaySheetRowActualUpdateInput(input.payload);
    await this.prisma.workdaySheetRow.update({ where: { id: row.id }, data: payload });
    return this.mapDetailForContext(
      await this.getReadableSheetOrThrow({
        companyId: input.companyId,
        sheetId: input.sheetId,
        actorUserId: input.actor.id,
        authContext: input.authContext,
      }),
      input.authContext,
    );
  }

  async deleteWorkdaySheetRow(input: {
    companyId: string;
    sheetId: string;
    rowId: string;
    authContext: RequestAuthContext;
  }): Promise<WorkdaySheetDetailResponse> {
    assertCanManageWorkdaySheets(input.authContext);
    const sheet = await this.getCompanySheetOrThrow(input.companyId, input.sheetId);
    if (sheet.status !== 'DRAFT') {
      throw new BadRequestException('Geplante Zeilen koennen nur im DRAFT entfernt werden.');
    }
    const row = this.getRowOrThrow(sheet, input.rowId);
    await this.prisma.workdaySheetRow.delete({ where: { id: row.id } });
    return mapWorkdaySheetDetail(
      await this.getCompanySheetOrThrow(input.companyId, input.sheetId),
    );
  }

  async transitionStatus(input: {
    companyId: string;
    sheetId: string;
    actor: AuthenticatedUser;
    authContext: RequestAuthContext;
    payload: WorkdaySheetStatusUpdateInput;
  }): Promise<WorkdaySheetDetailResponse> {
    const payload = normalizeWorkdaySheetStatusUpdateInput(input.payload);
    const workerSubmit = payload.status === 'SUBMITTED';
    const sheet = workerSubmit
      ? await this.getReadableSheetOrThrow({
          companyId: input.companyId,
          sheetId: input.sheetId,
          actorUserId: input.actor.id,
          authContext: input.authContext,
        })
      : await this.getCompanySheetOrThrow(input.companyId, input.sheetId);

    if (workerSubmit) {
      if (!input.authContext.isAuthenticated || input.authContext.membershipRole !== 'WORKER') {
        throw new ForbiddenException('Nur ein zugewiesener WORKER darf das Tagesblatt abgeben.');
      }
    } else {
      assertCanManageWorkdaySheets(input.authContext);
    }

    assertWorkdaySheetStatusTransition(sheet.status, payload.status);
    const now = new Date();
    let data: Prisma.WorkdaySheetUncheckedUpdateManyInput;

    if (payload.status === 'SENT') {
      if (!sheet.teamId && !sheet.workerUserId) {
        throw new BadRequestException('Vor dem Senden muss ein Team oder WORKER zugewiesen sein.');
      }
      if (!sheet.rows.length) {
        throw new BadRequestException('Vor dem Senden ist mindestens eine geplante Zeile erforderlich.');
      }
      await this.validateAssignees(input.companyId, {
        teamId: sheet.teamId,
        workerUserId: sheet.workerUserId,
      });
      data = { status: 'SENT', sentByUserId: input.actor.id, sentAt: now };
    } else if (payload.status === 'SUBMITTED') {
      if (sheet.rows.some((row) => !row.actualText)) {
        throw new BadRequestException(
          'Vor dem Abgeben muss fuer jede Zeile actualText erfasst werden.',
        );
      }
      data = {
        status: 'SUBMITTED',
        submittedByUserId: input.actor.id,
        submittedAt: now,
      };
    } else if (payload.status === 'REVIEWED') {
      data = {
        status: 'REVIEWED',
        reviewNotes: payload.reviewNotes,
        reviewedByUserId: input.actor.id,
        reviewedAt: now,
      };
    } else {
      data = {
        status: 'ARCHIVED',
        archivedByUserId: input.actor.id,
        archivedAt: now,
      };
    }

    const result = await this.prisma.workdaySheet.updateMany({
      where: { id: sheet.id, companyId: input.companyId, status: sheet.status },
      data,
    });
    if (result.count !== 1) {
      throw new ConflictException('Das Tagesblatt wurde parallel geaendert. Bitte neu laden.');
    }

    const updated = await this.getReadableSheetOrThrow({
      companyId: input.companyId,
      sheetId: input.sheetId,
      actorUserId: input.actor.id,
      authContext: input.authContext,
    });
    return this.mapDetailForContext(updated, input.authContext);
  }
}
