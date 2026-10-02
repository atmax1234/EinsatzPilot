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
  WorkdaySheetListFilters,
  WorkdaySheetListResponse,
  WorkdaySheetOptionsResponse,
  WorkdaySheetRowCreateInput,
  WorkdaySheetRowUpdateInput,
  WorkdaySheetStatusUpdateInput,
  WorkdaySheetTodayResponse,
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
  workdaySheetListInclude,
  type WorkdaySheetRecord,
} from './workday-sheet-mapper';
import {
  assertWorkdaySheetRowTimeRange,
  normalizeWorkdaySheetCreateInput,
  normalizeWorkdaySheetListFilters,
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

function localCalendarDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

  private listWhere(input: {
    companyId: string;
    actorUserId: string;
    authContext: RequestAuthContext;
    filters?: WorkdaySheetListFilters;
  }): Prisma.WorkdaySheetWhereInput {
    const filters = normalizeWorkdaySheetListFilters(input.filters ?? {});
    const visibility = isOfficeRole(input.authContext)
      ? { companyId: input.companyId }
      : this.workerAccessWhere(input.companyId, input.actorUserId);
    return {
      AND: [
        visibility,
        {
          date: filters.date,
          status: filters.status,
          teamId: filters.teamId,
          workerUserId: filters.workerUserId,
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

  private async lockWritableSheet(
    transaction: Prisma.TransactionClient,
    input: {
      companyId: string;
      sheetId: string;
      status: 'DRAFT' | 'SENT';
    },
  ) {
    const result = await transaction.workdaySheet.updateMany({
      where: {
        id: input.sheetId,
        companyId: input.companyId,
        status: input.status,
      },
      data: { updatedAt: new Date() },
    });
    if (result.count !== 1) {
      throw new ConflictException(
        'Der Status des Tageszettels hat sich geaendert. Bitte neu laden.',
      );
    }
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
      throw new BadRequestException(
        'Der direkt zugewiesene Mitarbeiter muss eine aktive WORKER-Mitgliedschaft haben.',
      );
    }

    return { team, workerMembership };
  }

  async getWorkdaySheets(input: {
    companyId: string;
    actor: AuthenticatedUser;
    authContext: RequestAuthContext;
    filters?: WorkdaySheetListFilters;
  }): Promise<WorkdaySheetListResponse> {
    assertCanReadWorkdaySheets(input.authContext);
    const sheets = await this.prisma.workdaySheet.findMany({
      where: this.listWhere({
        companyId: input.companyId,
        actorUserId: input.actor.id,
        authContext: input.authContext,
        filters: input.filters,
      }),
      include: workdaySheetListInclude,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
    return { workdaySheets: sheets.map(mapWorkdaySheetListItem) };
  }

  async getTodayWorkdaySheets(input: {
    companyId: string;
    actor: AuthenticatedUser;
    authContext: RequestAuthContext;
  }): Promise<WorkdaySheetTodayResponse> {
    assertCanReadWorkdaySheets(input.authContext);
    const date = localCalendarDate();
    const sheets = await this.prisma.workdaySheet.findMany({
      where: this.listWhere({
        companyId: input.companyId,
        actorUserId: input.actor.id,
        authContext: input.authContext,
        filters: { date },
      }),
      include: workdaySheetInclude,
      orderBy: [{ createdAt: 'asc' }],
    });
    return {
      date,
      workdaySheets: sheets.map(
        (sheet) => this.mapDetailForContext(sheet, input.authContext).workdaySheet,
      ),
    };
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
      throw new BadRequestException('Nur Tageszettel im Entwurf koennen geplant werden.');
    }
    await this.validateAssignees(input.companyId, {
      teamId: payload.teamId === undefined ? sheet.teamId : payload.teamId,
      workerUserId:
        payload.workerUserId === undefined ? sheet.workerUserId : payload.workerUserId,
    });

    const result = await this.prisma.workdaySheet.updateMany({
      where: { id: sheet.id, companyId: input.companyId, status: 'DRAFT' },
      data: payload,
    });
    if (result.count !== 1) {
      throw new ConflictException(
        'Der Status des Tageszettels hat sich geaendert. Bitte neu laden.',
      );
    }
    return mapWorkdaySheetDetail(
      await this.getCompanySheetOrThrow(input.companyId, input.sheetId),
    );
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
      throw new BadRequestException('Planzeilen koennen nur im Entwurf geaendert werden.');
    }
    if (sheet.rows.length >= 100) {
      throw new BadRequestException('Ein Tagesblatt darf hoechstens 100 Zeilen enthalten.');
    }
    await this.relationsService.validateRowRelations(input.companyId, payload);
    await this.prisma.$transaction(async (transaction) => {
      await this.lockWritableSheet(transaction, {
        companyId: input.companyId,
        sheetId: sheet.id,
        status: 'DRAFT',
      });
      const rowCount = await transaction.workdaySheetRow.count({
        where: { sheetId: sheet.id },
      });
      const lastRow = await transaction.workdaySheetRow.findFirst({
        where: { sheetId: sheet.id },
        select: { position: true },
        orderBy: { position: 'desc' },
      });
      if (rowCount >= 100) {
        throw new BadRequestException('Ein Tagesblatt darf hoechstens 100 Zeilen enthalten.');
      }
      await transaction.workdaySheetRow.create({
        data: {
          companyId: input.companyId,
          sheetId: sheet.id,
          position: (lastRow?.position ?? -1) + 1,
          ...payload,
        },
      });
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
        throw new BadRequestException('Planzeilen koennen nur im Entwurf geaendert werden.');
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
      await this.prisma.$transaction(async (transaction) => {
        await this.lockWritableSheet(transaction, {
          companyId: input.companyId,
          sheetId: sheet.id,
          status: 'DRAFT',
        });
        const result = await transaction.workdaySheetRow.updateMany({
          where: { id: row.id, sheetId: sheet.id, companyId: input.companyId },
          data: payload,
        });
        if (result.count !== 1) {
          throw new NotFoundException('Zeile wurde in diesem Tageszettel nicht gefunden.');
        }
      });
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
      throw new BadRequestException(
        'Tatsaechliche Arbeit kann nur in einem gesendeten Tageszettel erfasst werden.',
      );
    }
    const row = this.getRowOrThrow(sheet, input.rowId);
    const payload = normalizeWorkdaySheetRowActualUpdateInput(input.payload);
    await this.prisma.$transaction(async (transaction) => {
      await this.lockWritableSheet(transaction, {
        companyId: input.companyId,
        sheetId: sheet.id,
        status: 'SENT',
      });
      const result = await transaction.workdaySheetRow.updateMany({
        where: { id: row.id, sheetId: sheet.id, companyId: input.companyId },
        data: payload,
      });
      if (result.count !== 1) {
        throw new NotFoundException('Zeile wurde in diesem Tageszettel nicht gefunden.');
      }
    });
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
      throw new BadRequestException('Planzeilen koennen nur im Entwurf entfernt werden.');
    }
    const row = this.getRowOrThrow(sheet, input.rowId);
    await this.prisma.$transaction(async (transaction) => {
      await this.lockWritableSheet(transaction, {
        companyId: input.companyId,
        sheetId: sheet.id,
        status: 'DRAFT',
      });
      const result = await transaction.workdaySheetRow.deleteMany({
        where: { id: row.id, sheetId: sheet.id, companyId: input.companyId },
      });
      if (result.count !== 1) {
        throw new NotFoundException('Zeile wurde in diesem Tageszettel nicht gefunden.');
      }
    });
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
          'Vor dem Einreichen muss jede Zeile eine Beschreibung der tatsaechlichen Arbeit enthalten.',
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

    await this.prisma.$transaction(async (transaction) => {
      const result = await transaction.workdaySheet.updateMany({
        where: { id: sheet.id, companyId: input.companyId, status: sheet.status },
        data,
      });
      if (result.count !== 1) {
        throw new ConflictException('Das Tagesblatt wurde parallel geaendert. Bitte neu laden.');
      }

      if (payload.status === 'SENT') {
        const current = await transaction.workdaySheet.findUnique({
          where: { id: sheet.id },
          select: {
            teamId: true,
            workerUserId: true,
            _count: { select: { rows: true } },
          },
        });
        if (!current?.teamId && !current?.workerUserId) {
          throw new BadRequestException(
            'Vor dem Senden muss ein Team oder WORKER zugewiesen sein.',
          );
        }
        if (!current._count.rows) {
          throw new BadRequestException(
            'Vor dem Senden ist mindestens eine geplante Zeile erforderlich.',
          );
        }
      }

      if (payload.status === 'SUBMITTED') {
        const incompleteRows = await transaction.workdaySheetRow.count({
          where: { sheetId: sheet.id, actualText: null },
        });
        if (incompleteRows) {
          throw new BadRequestException(
            'Vor dem Einreichen muss jede Zeile eine Beschreibung der tatsaechlichen Arbeit enthalten.',
          );
        }
      }
    });

    const updated = await this.getReadableSheetOrThrow({
      companyId: input.companyId,
      sheetId: input.sheetId,
      actorUserId: input.actor.id,
      authContext: input.authContext,
    });
    return this.mapDetailForContext(updated, input.authContext);
  }
}
