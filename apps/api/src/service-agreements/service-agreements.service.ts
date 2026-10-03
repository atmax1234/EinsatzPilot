import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type {
  AuthenticatedUser,
  RecurringObjectDutyCreateInput,
  RecurringObjectDutyUpdateInput,
  RequestAuthContext,
  ServiceAgreementCreateInput,
  ServiceAgreementDetailResponse,
  ServiceAgreementListFilters,
  ServiceAgreementListResponse,
  ServiceAgreementOptionsResponse,
  ServiceAgreementStatusUpdateInput,
  ServiceAgreementUpdateInput,
} from '@einsatzpilot/types';

import { OperationsLookupService } from '../operations/operations-lookup.service';
import {
  assertCanReadServiceAgreements,
  assertCanWriteServiceAgreements,
} from '../operations/operations-permissions';
import { PrismaService } from '../prisma/prisma.service';
import {
  mapServiceAgreementDetail,
  mapServiceAgreementListItem,
  serviceAgreementDetailInclude,
  serviceAgreementListInclude,
} from './service-agreement-mapper';
import {
  assertDutyDateWithinAgreement,
  assertEffectiveDateRange,
  assertRecurringDutyTimeRange,
  normalizeRecurringObjectDutyCreateInput,
  normalizeRecurringObjectDutyUpdateInput,
  normalizeServiceAgreementCreateInput,
  normalizeServiceAgreementListFilters,
  normalizeServiceAgreementStatusUpdateInput,
  normalizeServiceAgreementUpdateInput,
} from './service-agreement-payloads';
import { ServiceAgreementRelationsService } from './service-agreement-relations.service';
import { assertServiceAgreementStatusTransition } from './service-agreement-status-rules';

@Injectable()
export class ServiceAgreementsService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(OperationsLookupService)
    private readonly operationsLookupService: OperationsLookupService,
    @Inject(ServiceAgreementRelationsService)
    private readonly relationsService: ServiceAgreementRelationsService,
  ) {}

  private async getLockedAgreement(
    transaction: Prisma.TransactionClient,
    companyId: string,
    agreementId: string,
  ) {
    const rows = await transaction.$queryRaw<Array<{ id: string }>>(
      Prisma.sql`SELECT "id" FROM "ServiceAgreement" WHERE "id" = ${agreementId} AND "companyId" = ${companyId} FOR UPDATE`,
    );
    if (!rows.length) {
      throw new NotFoundException(
        'Leistungsvereinbarung wurde in der aktiven Firma nicht gefunden.',
      );
    }
    const agreement = await transaction.serviceAgreement.findFirst({
      where: { id: agreementId, companyId },
      include: serviceAgreementDetailInclude,
    });
    if (!agreement) {
      throw new NotFoundException(
        'Leistungsvereinbarung wurde in der aktiven Firma nicht gefunden.',
      );
    }
    return agreement;
  }

  private assertEditable(status: string) {
    if (status === 'ACTIVE') {
      throw new BadRequestException(
        'Aktive Leistungsvereinbarungen muessen vor Aenderungen deaktiviert werden.',
      );
    }
    if (status === 'ARCHIVED') {
      throw new BadRequestException('Archivierte Leistungsvereinbarungen sind schreibgeschuetzt.');
    }
  }

  async getServiceAgreements(input: {
    companyId: string;
    authContext: RequestAuthContext;
    filters: ServiceAgreementListFilters;
  }): Promise<ServiceAgreementListResponse> {
    assertCanReadServiceAgreements(input.authContext);
    const filters = normalizeServiceAgreementListFilters(input.filters);
    const agreements = await this.prisma.serviceAgreement.findMany({
      where: {
        companyId: input.companyId,
        status: filters.status,
        customerId: filters.customerId,
        objectId: filters.objectId,
      },
      include: serviceAgreementListInclude,
      orderBy: [{ status: 'asc' }, { effectiveFrom: 'desc' }, { title: 'asc' }],
    });
    return { serviceAgreements: agreements.map(mapServiceAgreementListItem) };
  }

  async getOptions(input: {
    companyId: string;
    authContext: RequestAuthContext;
  }): Promise<ServiceAgreementOptionsResponse> {
    assertCanReadServiceAgreements(input.authContext);
    return this.operationsLookupService.getJobRelationOptions(input.companyId);
  }

  async getServiceAgreementDetail(input: {
    companyId: string;
    agreementId: string;
    authContext: RequestAuthContext;
  }): Promise<ServiceAgreementDetailResponse> {
    assertCanReadServiceAgreements(input.authContext);
    const agreement = await this.prisma.serviceAgreement.findFirst({
      where: { id: input.agreementId, companyId: input.companyId },
      include: serviceAgreementDetailInclude,
    });
    if (!agreement) {
      throw new NotFoundException(
        'Leistungsvereinbarung wurde in der aktiven Firma nicht gefunden.',
      );
    }
    return mapServiceAgreementDetail(agreement);
  }

  async createServiceAgreement(input: {
    companyId: string;
    actor: AuthenticatedUser;
    authContext: RequestAuthContext;
    payload: ServiceAgreementCreateInput;
  }): Promise<ServiceAgreementDetailResponse> {
    assertCanWriteServiceAgreements(input.authContext);
    const payload = normalizeServiceAgreementCreateInput(input.payload);
    payload.duties.forEach((duty) =>
      assertDutyDateWithinAgreement(
        duty.firstDueDate,
        payload.effectiveFrom,
        payload.effectiveUntil,
      ),
    );

    return this.prisma.$transaction(async (transaction) => {
      await this.relationsService.validate(transaction, input.companyId, payload);
      const agreement = await transaction.serviceAgreement.create({
        data: {
          companyId: input.companyId,
          title: payload.title,
          description: payload.description,
          effectiveFrom: payload.effectiveFrom,
          effectiveUntil: payload.effectiveUntil,
          timezone: payload.timezone,
          customerId: payload.customerId,
          addressId: payload.addressId,
          objectId: payload.objectId,
          objectAreaId: payload.objectAreaId,
          internalNotes: payload.internalNotes,
          createdByUserId: input.actor.id,
          updatedByUserId: input.actor.id,
          duties: {
            create: payload.duties.map((duty, position) => ({
              ...duty,
              position,
              companyId: input.companyId,
              createdByUserId: input.actor.id,
              updatedByUserId: input.actor.id,
            })),
          },
        },
        include: serviceAgreementDetailInclude,
      });
      return mapServiceAgreementDetail(agreement);
    });
  }

  async updateServiceAgreement(input: {
    companyId: string;
    agreementId: string;
    actor: AuthenticatedUser;
    authContext: RequestAuthContext;
    payload: ServiceAgreementUpdateInput;
  }): Promise<ServiceAgreementDetailResponse> {
    assertCanWriteServiceAgreements(input.authContext);
    const payload = normalizeServiceAgreementUpdateInput(input.payload);

    return this.prisma.$transaction(async (transaction) => {
      const agreement = await this.getLockedAgreement(
        transaction,
        input.companyId,
        input.agreementId,
      );
      this.assertEditable(agreement.status);
      const effectiveFrom = payload.effectiveFrom ?? agreement.effectiveFrom;
      const effectiveUntil =
        payload.effectiveUntil === undefined ? agreement.effectiveUntil : payload.effectiveUntil;
      assertEffectiveDateRange(effectiveFrom, effectiveUntil);
      agreement.duties.forEach((duty) =>
        assertDutyDateWithinAgreement(duty.firstDueDate, effectiveFrom, effectiveUntil),
      );
      const relations = {
        customerId:
          payload.customerId === undefined ? agreement.customerId : payload.customerId,
        addressId: payload.addressId === undefined ? agreement.addressId : payload.addressId,
        objectId: payload.objectId === undefined ? agreement.objectId : payload.objectId,
        objectAreaId:
          payload.objectAreaId === undefined ? agreement.objectAreaId : payload.objectAreaId,
      };
      await this.relationsService.validate(transaction, input.companyId, relations);

      const updated = await transaction.serviceAgreement.update({
        where: { id: agreement.id },
        data: { ...payload, updatedByUserId: input.actor.id },
        include: serviceAgreementDetailInclude,
      });
      return mapServiceAgreementDetail(updated);
    });
  }

  async addDuty(input: {
    companyId: string;
    agreementId: string;
    actor: AuthenticatedUser;
    authContext: RequestAuthContext;
    payload: RecurringObjectDutyCreateInput;
  }): Promise<ServiceAgreementDetailResponse> {
    assertCanWriteServiceAgreements(input.authContext);
    const payload = normalizeRecurringObjectDutyCreateInput(input.payload);

    return this.prisma.$transaction(async (transaction) => {
      const agreement = await this.getLockedAgreement(
        transaction,
        input.companyId,
        input.agreementId,
      );
      this.assertEditable(agreement.status);
      if (agreement.duties.length >= 100) {
        throw new BadRequestException(
          'Eine Leistungsvereinbarung darf hoechstens 100 wiederkehrende Pflichten enthalten.',
        );
      }
      assertDutyDateWithinAgreement(
        payload.firstDueDate,
        agreement.effectiveFrom,
        agreement.effectiveUntil,
      );
      const position = agreement.duties.reduce(
        (maximum, duty) => Math.max(maximum, duty.position),
        -1,
      ) + 1;
      await transaction.recurringObjectDuty.create({
        data: {
          ...payload,
          companyId: input.companyId,
          agreementId: agreement.id,
          position,
          createdByUserId: input.actor.id,
          updatedByUserId: input.actor.id,
        },
      });
      const updated = await transaction.serviceAgreement.findUniqueOrThrow({
        where: { id: agreement.id },
        include: serviceAgreementDetailInclude,
      });
      return mapServiceAgreementDetail(updated);
    });
  }

  async updateDuty(input: {
    companyId: string;
    agreementId: string;
    dutyId: string;
    actor: AuthenticatedUser;
    authContext: RequestAuthContext;
    payload: RecurringObjectDutyUpdateInput;
  }): Promise<ServiceAgreementDetailResponse> {
    assertCanWriteServiceAgreements(input.authContext);
    const payload = normalizeRecurringObjectDutyUpdateInput(input.payload);

    return this.prisma.$transaction(async (transaction) => {
      const agreement = await this.getLockedAgreement(
        transaction,
        input.companyId,
        input.agreementId,
      );
      this.assertEditable(agreement.status);
      const duty = agreement.duties.find((candidate) => candidate.id === input.dutyId);
      if (!duty) {
        throw new NotFoundException(
          'Wiederkehrende Pflicht wurde in der Vereinbarung nicht gefunden.',
        );
      }
      const firstDueDate = payload.firstDueDate ?? duty.firstDueDate;
      const startTime = payload.startTime === undefined ? duty.startTime : payload.startTime;
      const endTime = payload.endTime === undefined ? duty.endTime : payload.endTime;
      assertDutyDateWithinAgreement(
        firstDueDate,
        agreement.effectiveFrom,
        agreement.effectiveUntil,
      );
      assertRecurringDutyTimeRange(startTime, endTime);
      await transaction.recurringObjectDuty.update({
        where: { id: duty.id },
        data: { ...payload, updatedByUserId: input.actor.id },
      });
      const updated = await transaction.serviceAgreement.findUniqueOrThrow({
        where: { id: agreement.id },
        include: serviceAgreementDetailInclude,
      });
      return mapServiceAgreementDetail(updated);
    });
  }

  async transitionStatus(input: {
    companyId: string;
    agreementId: string;
    actor: AuthenticatedUser;
    authContext: RequestAuthContext;
    payload: ServiceAgreementStatusUpdateInput;
  }): Promise<ServiceAgreementDetailResponse> {
    assertCanWriteServiceAgreements(input.authContext);
    const payload = normalizeServiceAgreementStatusUpdateInput(input.payload);

    return this.prisma.$transaction(async (transaction) => {
      const agreement = await this.getLockedAgreement(
        transaction,
        input.companyId,
        input.agreementId,
      );
      assertServiceAgreementStatusTransition(agreement.status, payload.status);
      if (payload.status === 'ACTIVE' && !agreement.duties.some((duty) => duty.isActive)) {
        throw new BadRequestException(
          'Zum Aktivieren ist mindestens eine aktive wiederkehrende Pflicht erforderlich.',
        );
      }
      const changedAt = new Date();
      const statusAudit =
        payload.status === 'ACTIVE'
          ? { activatedAt: changedAt, activatedByUserId: input.actor.id }
          : payload.status === 'INACTIVE'
            ? { deactivatedAt: changedAt, deactivatedByUserId: input.actor.id }
            : { archivedAt: changedAt, archivedByUserId: input.actor.id };
      const updated = await transaction.serviceAgreement.update({
        where: { id: agreement.id },
        data: {
          status: payload.status,
          updatedByUserId: input.actor.id,
          ...statusAudit,
        },
        include: serviceAgreementDetailInclude,
      });
      return mapServiceAgreementDetail(updated);
    });
  }
}
