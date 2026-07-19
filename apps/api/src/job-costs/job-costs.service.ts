import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import type {
  AuthenticatedUser,
  JobCostCreateInput,
  JobCostListResponse,
  JobCostSummary,
  JobCostUpdateInput,
  RequestAuthContext,
} from '@einsatzpilot/types';

import { OperationsLookupService } from '../operations/operations-lookup.service';
import {
  assertCanReadJobCosts,
  assertCanWriteJobCosts,
} from '../operations/operations-permissions';
import { PrismaService } from '../prisma/prisma.service';
import { buildJobCostSummary, resolveJobCostAmounts } from './job-cost-calculation';
import {
  normalizeJobCostCreateInput,
  normalizeJobCostUpdateInput,
} from './job-cost-payloads';
import { mapJobCostLine } from './job-costs-mapper';

const costLineInclude = {
  item: {
    select: {
      id: true,
      customId: true,
      name: true,
    },
  },
  createdBy: {
    select: {
      id: true,
      email: true,
      displayName: true,
    },
  },
  updatedBy: {
    select: {
      id: true,
      email: true,
      displayName: true,
    },
  },
} as const;

@Injectable()
export class JobCostsService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(OperationsLookupService)
    private readonly operationsLookupService: OperationsLookupService,
  ) {}

  private async getCostLineForJobOrThrow(input: {
    companyId: string;
    jobId: string;
    costLineId: string;
  }) {
    const costLine = await this.prisma.jobCostLine.findFirst({
      where: {
        id: input.costLineId,
        companyId: input.companyId,
        jobId: input.jobId,
      },
      include: costLineInclude,
    });

    if (!costLine) {
      throw new NotFoundException('Kostenzeile fuer diesen Auftrag nicht gefunden.');
    }

    return costLine;
  }

  private async assertItemForCompany(companyId: string, itemId: string) {
    const item = await this.prisma.item.findFirst({
      where: { id: itemId, companyId },
      select: { id: true },
    });

    if (!item) {
      throw new NotFoundException('Artikel wurde in der aktiven Firma nicht gefunden.');
    }
  }

  private async assertCurrencyConsistency(input: {
    companyId: string;
    jobId: string;
    currency: string;
    excludeCostLineId?: string;
  }) {
    const conflictingLine = await this.prisma.jobCostLine.findFirst({
      where: {
        companyId: input.companyId,
        jobId: input.jobId,
        currency: { not: input.currency },
        id: input.excludeCostLineId ? { not: input.excludeCostLineId } : undefined,
      },
      select: { currency: true },
    });

    if (conflictingLine) {
      throw new BadRequestException(
        `Alle Kostenzeilen eines Auftrags muessen dieselbe Waehrung verwenden (${conflictingLine.currency}).`,
      );
    }
  }

  private async getPersistedCostLines(companyId: string, jobId: string) {
    return this.prisma.jobCostLine.findMany({
      where: { companyId, jobId },
      include: costLineInclude,
      orderBy: [{ costDate: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async getJobCosts(input: {
    companyId: string;
    jobId: string;
    authContext: RequestAuthContext;
  }): Promise<JobCostListResponse> {
    assertCanReadJobCosts(input.authContext);
    await this.operationsLookupService.getJobForCompanyOrThrow(input.companyId, input.jobId);
    const costLines = await this.getPersistedCostLines(input.companyId, input.jobId);

    return {
      costLines: costLines.map(mapJobCostLine),
      summary: buildJobCostSummary(costLines),
    };
  }

  async getJobCostSummary(input: {
    companyId: string;
    jobId: string;
    authContext: RequestAuthContext;
  }): Promise<JobCostSummary> {
    assertCanReadJobCosts(input.authContext);
    await this.operationsLookupService.getJobForCompanyOrThrow(input.companyId, input.jobId);
    const costLines = await this.getPersistedCostLines(input.companyId, input.jobId);
    return buildJobCostSummary(costLines);
  }

  async createJobCost(input: {
    companyId: string;
    jobId: string;
    actor: AuthenticatedUser;
    authContext: RequestAuthContext;
    payload: JobCostCreateInput;
  }) {
    assertCanWriteJobCosts(input.authContext);
    const payload = normalizeJobCostCreateInput(input.payload);
    const job = await this.operationsLookupService.getJobForCompanyOrThrow(
      input.companyId,
      input.jobId,
    );

    if (payload.itemId) {
      await this.assertItemForCompany(input.companyId, payload.itemId);
    }

    await this.assertCurrencyConsistency({
      companyId: input.companyId,
      jobId: job.id,
      currency: payload.currency,
    });

    const amounts = resolveJobCostAmounts({
      kind: payload.kind,
      quantity: payload.quantity,
      unitCost: payload.unitCost ?? null,
      submittedTotalCost: payload.totalCost,
    });

    const costLine = await this.prisma.jobCostLine.create({
      data: {
        ...payload,
        companyId: input.companyId,
        jobId: job.id,
        createdByUserId: input.actor.id,
        updatedByUserId: input.actor.id,
        quantity: amounts.quantity,
        unitCost: amounts.unitCost,
        totalCost: amounts.totalCost,
      },
      include: costLineInclude,
    });

    return mapJobCostLine(costLine);
  }

  async updateJobCost(input: {
    companyId: string;
    jobId: string;
    costLineId: string;
    actor: AuthenticatedUser;
    authContext: RequestAuthContext;
    payload: JobCostUpdateInput;
  }) {
    assertCanWriteJobCosts(input.authContext);
    const payload = normalizeJobCostUpdateInput(input.payload);
    const job = await this.operationsLookupService.getJobForCompanyOrThrow(
      input.companyId,
      input.jobId,
    );
    const costLine = await this.getCostLineForJobOrThrow({
      companyId: input.companyId,
      jobId: job.id,
      costLineId: input.costLineId,
    });

    if (payload.itemId) {
      await this.assertItemForCompany(input.companyId, payload.itemId);
    }

    const currency = payload.currency ?? costLine.currency;
    await this.assertCurrencyConsistency({
      companyId: input.companyId,
      jobId: job.id,
      currency,
      excludeCostLineId: costLine.id,
    });

    const kind = payload.kind ?? costLine.kind;
    const quantity = payload.quantity ?? costLine.quantity.toNumber();
    const unitCost =
      payload.unitCost === undefined
        ? costLine.unitCost?.toNumber() ?? null
        : payload.unitCost;
    const amounts = resolveJobCostAmounts({
      kind,
      quantity,
      unitCost,
      submittedTotalCost: payload.totalCost,
      existingTotalCost: costLine.totalCost,
    });

    const updated = await this.prisma.jobCostLine.update({
      where: { id: costLine.id },
      data: {
        ...payload,
        currency,
        updatedByUserId: input.actor.id,
        quantity: amounts.quantity,
        unitCost: amounts.unitCost,
        totalCost: amounts.totalCost,
      },
      include: costLineInclude,
    });

    return mapJobCostLine(updated);
  }
}
