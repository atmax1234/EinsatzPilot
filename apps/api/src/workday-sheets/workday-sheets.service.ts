import { createHash } from 'node:crypto';

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
  WorksheetFollowUpJobCreateInput,
  WorksheetFollowUpJobCreateResponse,
  WorksheetReviewActionSourceSnapshotV1,
} from '@einsatzpilot/types';

import {
  buildJobCreatedActivity,
  buildJobRelationChangedActivities,
} from '../operations/job-activity-rules';
import { OperationsLookupService } from '../operations/operations-lookup.service';
import { mapJobListItem } from '../operations/operations-mapper';
import {
  assertCanManageWorkdaySheets,
  assertCanReadWorkdaySheets,
} from '../operations/operations-permissions';
import { createJobReference } from '../operations/operations-reference';
import { PrismaService } from '../prisma/prisma.service';
import {
  mapWorkdaySheetDetail,
  mapWorkdaySheetListItem,
  mapWorksheetReviewAction,
  workdaySheetInclude,
  workdaySheetListInclude,
  worksheetReviewActionInclude,
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
import { normalizeWorksheetFollowUpJobCreateInput } from './worksheet-review-action-payloads';

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

const followUpJobInclude = {
  team: true,
  customer: true,
  address: true,
  object: true,
  objectArea: true,
} as const;

type FollowUpPayload = ReturnType<typeof normalizeWorksheetFollowUpJobCreateInput>;

function actorName(actor: AuthenticatedUser) {
  return actor.displayName ?? actor.email;
}

function sourceSnapshot(
  sheet: WorkdaySheetRecord,
  row: WorkdaySheetRecord['rows'][number],
  capturedAt: Date,
): WorksheetReviewActionSourceSnapshotV1 {
  return {
    schemaVersion: 1,
    capturedAt: capturedAt.toISOString(),
    sheet: {
      id: sheet.id,
      date: sheet.date.toISOString().slice(0, 10),
      ...(sheet.title ? { title: sheet.title } : {}),
      status: 'REVIEWED',
      ...(sheet.team ? { team: { id: sheet.team.id, name: sheet.team.name } } : {}),
      ...(sheet.worker
        ? {
            worker: {
              id: sheet.worker.id,
              name: sheet.worker.displayName ?? sheet.worker.email,
              email: sheet.worker.email,
            },
          }
        : {}),
    },
    row: {
      id: row.id,
      position: row.position,
      ...(row.startTime ? { startTime: row.startTime } : {}),
      ...(row.endTime ? { endTime: row.endTime } : {}),
      plannedText: row.plannedText,
      ...(row.actualText ? { actualText: row.actualText } : {}),
      ...(row.notes ? { notes: row.notes } : {}),
      ...(row.customer ? { customer: row.customer } : {}),
      ...(row.address ? { address: row.address } : {}),
      ...(row.object ? { object: row.object } : {}),
      ...(row.objectArea ? { objectArea: row.objectArea } : {}),
      ...(row.job ? { job: row.job } : {}),
    },
  };
}

function requestFingerprint(
  payload: FollowUpPayload,
  relationIds: {
    teamId?: string;
    customerId?: string;
    addressId?: string;
    objectId?: string;
    objectAreaId?: string;
  },
) {
  const serialized = JSON.stringify({
    title: payload.title,
    description: payload.description ?? null,
    customerName: payload.customerName,
    location: payload.location,
    scheduledStart: payload.scheduledStart.toISOString(),
    scheduledEnd: payload.scheduledEnd?.toISOString() ?? null,
    priority: payload.priority,
    teamId: relationIds.teamId ?? null,
    customerId: relationIds.customerId ?? null,
    addressId: relationIds.addressId ?? null,
    objectId: relationIds.objectId ?? null,
    objectAreaId: relationIds.objectAreaId ?? null,
  });
  return createHash('sha256').update(serialized).digest('hex');
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

  private async resolveFollowUpJobRelations(
    transaction: Prisma.TransactionClient,
    companyId: string,
    relationIds: {
      teamId?: string;
      customerId?: string;
      addressId?: string;
      objectId?: string;
      objectAreaId?: string;
    },
  ) {
    if (relationIds.objectAreaId && !relationIds.objectId) {
      throw new BadRequestException('objectAreaId erfordert objectId.');
    }

    const [team, customer, address, object, objectArea] = await Promise.all([
      relationIds.teamId
        ? transaction.team.findFirst({
            where: { id: relationIds.teamId, companyId },
            select: { id: true, name: true },
          })
        : null,
      relationIds.customerId
        ? transaction.customer.findFirst({
            where: { id: relationIds.customerId, companyId },
            select: { id: true, name: true },
          })
        : null,
      relationIds.addressId
        ? transaction.address.findFirst({
            where: { id: relationIds.addressId, companyId },
            select: {
              id: true,
              label: true,
              street: true,
              postalCode: true,
              city: true,
              country: true,
            },
          })
        : null,
      relationIds.objectId
        ? transaction.object.findFirst({
            where: { id: relationIds.objectId, companyId },
            select: { id: true, name: true },
          })
        : null,
      relationIds.objectAreaId
        ? transaction.objectArea.findFirst({
            where: { id: relationIds.objectAreaId, companyId },
            select: { id: true, objectId: true, name: true },
          })
        : null,
    ]);

    if (relationIds.teamId && !team) throw new NotFoundException('Team nicht gefunden.');
    if (relationIds.customerId && !customer) {
      throw new NotFoundException('Kunde wurde in der aktiven Firma nicht gefunden.');
    }
    if (relationIds.addressId && !address) {
      throw new NotFoundException('Adresse wurde in der aktiven Firma nicht gefunden.');
    }
    if (relationIds.objectId && !object) {
      throw new NotFoundException('Objekt wurde in der aktiven Firma nicht gefunden.');
    }
    if (relationIds.objectAreaId && !objectArea) {
      throw new NotFoundException('Objektbereich wurde in der aktiven Firma nicht gefunden.');
    }
    if (objectArea && object && objectArea.objectId !== object.id) {
      throw new BadRequestException('Der Objektbereich gehoert nicht zum ausgewaehlten Objekt.');
    }

    return { team, customer, address, object, objectArea };
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

  async createFollowUpJobFromRow(input: {
    companyId: string;
    sheetId: string;
    rowId: string;
    actor: AuthenticatedUser;
    authContext: RequestAuthContext;
    payload: WorksheetFollowUpJobCreateInput;
  }): Promise<WorksheetFollowUpJobCreateResponse> {
    assertCanManageWorkdaySheets(input.authContext);
    const payload = normalizeWorksheetFollowUpJobCreateInput(input.payload);

    return this.prisma.$transaction(async (transaction) => {
      const lockedSheet = await transaction.$queryRaw<Array<{ id: string }>>(
        Prisma.sql`SELECT "id" FROM "WorkdaySheet" WHERE "id" = ${input.sheetId} AND "companyId" = ${input.companyId} FOR UPDATE`,
      );
      if (!lockedSheet.length) {
        throw new NotFoundException('Tagesblatt wurde in der aktiven Firma nicht gefunden.');
      }

      const sheet = await transaction.workdaySheet.findFirst({
        where: { id: input.sheetId, companyId: input.companyId },
        include: workdaySheetInclude,
      });
      if (!sheet) {
        throw new NotFoundException('Tagesblatt wurde in der aktiven Firma nicht gefunden.');
      }
      if (sheet.status !== 'REVIEWED') {
        throw new BadRequestException(
          'Folgeauftraege koennen nur aus geprueften Tageszetteln erstellt werden.',
        );
      }
      const row = this.getRowOrThrow(sheet, input.rowId);
      const relationIds = {
        teamId:
          payload.teamId === undefined ? sheet.teamId ?? undefined : payload.teamId ?? undefined,
        customerId:
          payload.customerId === undefined
            ? row.customerId ?? undefined
            : payload.customerId ?? undefined,
        addressId:
          payload.addressId === undefined
            ? row.addressId ?? undefined
            : payload.addressId ?? undefined,
        objectId:
          payload.objectId === undefined ? row.objectId ?? undefined : payload.objectId ?? undefined,
        objectAreaId:
          payload.objectAreaId === undefined
            ? row.objectAreaId ?? undefined
            : payload.objectAreaId ?? undefined,
      };
      const relations = await this.resolveFollowUpJobRelations(
        transaction,
        input.companyId,
        relationIds,
      );
      const fingerprint = requestFingerprint(payload, relationIds);
      const existingAction = row.reviewActions.find(
        (action) => action.type === 'CREATE_FOLLOW_UP_JOB',
      );

      if (existingAction) {
        if (existingAction.requestFingerprint !== fingerprint) {
          throw new ConflictException(
            'Diese Zeile hat bereits einen Folgeauftrag mit anderen Zieldaten.',
          );
        }
        const existingJob = await transaction.job.findFirst({
          where: { id: existingAction.destinationJobId, companyId: input.companyId },
          include: followUpJobInclude,
        });
        if (!existingJob) {
          throw new ConflictException('Der bereits erstellte Folgeauftrag ist nicht verfuegbar.');
        }
        return {
          reviewAction: mapWorksheetReviewAction(existingAction),
          job: mapJobListItem(existingJob),
          replayed: true,
        };
      }

      const completedAt = new Date();
      const reference = createJobReference();
      const job = await transaction.job.create({
        data: {
          companyId: input.companyId,
          teamId: relations.team?.id,
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
          status: 'PLANNED',
        },
        include: followUpJobInclude,
      });

      const activities = [
        buildJobCreatedActivity({ actor: input.actor, reference, title: payload.title }),
        {
          kind: 'NOTE' as const,
          title: 'Aus geprueftem Tageszettel erstellt',
          content: `Quelle: Tageszettel ${sheet.date.toISOString().slice(0, 10)}, Zeile ${row.position + 1} (${sheet.id}/${row.id}).`,
          authorName: actorName(input.actor),
        },
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
      ];
      await transaction.jobActivity.createMany({
        data: activities.map((activity) => ({
          jobId: job.id,
          kind: activity.kind,
          title: activity.title,
          content: activity.content,
          authorName: activity.authorName,
        })),
      });

      const snapshot = sourceSnapshot(sheet, row, completedAt);
      const reviewAction = await transaction.worksheetReviewAction.create({
        data: {
          companyId: input.companyId,
          sourceSheetId: sheet.id,
          sourceRowId: row.id,
          type: 'CREATE_FOLLOW_UP_JOB',
          status: 'COMPLETED',
          idempotencyKey: `worksheet-row:${row.id}:follow-up-job`,
          requestFingerprint: fingerprint,
          sourceSnapshot: JSON.parse(JSON.stringify(snapshot)) as Prisma.InputJsonValue,
          destinationJobId: job.id,
          destinationJobReference: job.reference,
          destinationJobTitle: job.title,
          createdByUserId: input.actor.id,
          completedAt,
        },
        include: worksheetReviewActionInclude,
      });

      return {
        reviewAction: mapWorksheetReviewAction(reviewAction),
        job: mapJobListItem(job),
        replayed: false,
      };
    });
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
