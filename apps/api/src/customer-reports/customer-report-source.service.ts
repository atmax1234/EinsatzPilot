import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type {
  CustomerReportCostBreakdown,
  CustomerReportSourceData,
  CustomerReportSourceDataResponse,
  RequestAuthContext,
} from '@einsatzpilot/types';

import { buildJobCostSummary } from '../job-costs/job-cost-calculation';
import { mapJobCostLine } from '../job-costs/job-costs-mapper';
import { assertCanReadCustomerReports } from '../operations/operations-permissions';
import { PrismaService } from '../prisma/prisma.service';
import { mapJobReportItem } from '../reports/reports-mapper';
import type { normalizeCustomerReportCreateInput } from './customer-report-payloads';
import {
  formatSnapshotAddress,
  mapCustomerReportAddressSource,
  mapCustomerReportAttachmentSource,
  mapCustomerReportCostLineSnapshot,
  mapCustomerReportCustomerSource,
  mapCustomerReportJobReportSource,
  mapCustomerReportJobSource,
  mapCustomerReportObjectAreaSource,
  mapCustomerReportObjectSource,
} from './customer-report-snapshot';

type NormalizedCreateInput = ReturnType<typeof normalizeCustomerReportCreateInput>;

const jobContextInclude = {
  customer: {
    select: {
      id: true,
      name: true,
      type: true,
      email: true,
      phone: true,
      updatedAt: true,
    },
  },
  address: {
    select: {
      id: true,
      label: true,
      street: true,
      postalCode: true,
      city: true,
      country: true,
      updatedAt: true,
    },
  },
  object: {
    select: {
      id: true,
      name: true,
      type: true,
      status: true,
      updatedAt: true,
    },
  },
  objectArea: {
    select: {
      id: true,
      objectId: true,
      name: true,
      type: true,
      updatedAt: true,
    },
  },
} satisfies Prisma.JobInclude;

const jobReportInclude = {
  author: {
    select: { id: true, email: true, displayName: true },
  },
  team: {
    select: { id: true, name: true },
  },
  reviewer: {
    select: { id: true, email: true, displayName: true },
  },
  attachments: {
    orderBy: { createdAt: 'desc' as const },
  },
} satisfies Prisma.JobReportInclude;

const costLineInclude = {
  item: {
    select: { id: true, customId: true, name: true },
  },
  createdBy: {
    select: { id: true, email: true, displayName: true },
  },
  updatedBy: {
    select: { id: true, email: true, displayName: true },
  },
} satisfies Prisma.JobCostLineInclude;

@Injectable()
export class CustomerReportSourceService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async getJobCustomerReportSourceData(input: {
    companyId: string;
    jobId: string;
    authContext: RequestAuthContext;
  }): Promise<CustomerReportSourceDataResponse> {
    assertCanReadCustomerReports(input.authContext);

    return this.prisma.$transaction(
      async (transaction) => {
        const sources = await this.loadAllJobSources(
          transaction,
          input.companyId,
          input.jobId,
        );

        return {
          job: mapCustomerReportJobSource(sources.job),
          customer: mapCustomerReportCustomerSource(sources.job.customer),
          address: mapCustomerReportAddressSource(sources.job.address),
          object: mapCustomerReportObjectSource(sources.job.object),
          objectArea: mapCustomerReportObjectAreaSource(sources.job.objectArea),
          jobReports: sources.jobReports.map((report) => ({
            ...mapJobReportItem(report),
            selectable: report.reviewStatus === 'APPROVED',
          })),
          attachments: sources.attachments.map((attachment) => ({
            id: attachment.id,
            reportId: attachment.reportId ?? undefined,
            kind: attachment.kind,
            fileName: attachment.fileName,
            mimeType: attachment.mimeType,
            sizeBytes: attachment.sizeBytes,
            caption: attachment.caption ?? undefined,
            uploadedAt: attachment.createdAt.toISOString(),
            selectable: true,
          })),
          costLines: sources.costLines.map(mapJobCostLine),
          costSummary: buildJobCostSummary(sources.costLines),
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
  }

  async buildSnapshot(
    transaction: Prisma.TransactionClient,
    companyId: string,
    payload: NormalizedCreateInput,
  ) {
    const job = await transaction.job.findFirst({
      where: { id: payload.jobId, companyId },
      include: jobContextInclude,
    });

    if (!job) {
      throw new NotFoundException('Job nicht gefunden.');
    }

    const [selectedReportsRaw, selectedAttachmentsRaw, selectedCostLinesRaw, allCostLines] =
      await Promise.all([
        payload.selectedJobReportIds.length
          ? transaction.jobReport.findMany({
              where: {
                id: { in: payload.selectedJobReportIds },
                companyId,
                jobId: job.id,
              },
              include: {
                author: { select: { id: true, email: true, displayName: true } },
                reviewer: { select: { id: true, email: true, displayName: true } },
                team: { select: { id: true, name: true } },
              },
            })
          : [],
        payload.selectedAttachmentIds.length
          ? transaction.jobAttachment.findMany({
              where: {
                id: { in: payload.selectedAttachmentIds },
                companyId,
                jobId: job.id,
              },
            })
          : [],
        payload.selectedCostLineIds.length
          ? transaction.jobCostLine.findMany({
              where: {
                id: { in: payload.selectedCostLineIds },
                companyId,
                jobId: job.id,
              },
              include: costLineInclude,
            })
          : [],
        payload.includeFullCostSummary
          ? transaction.jobCostLine.findMany({
              where: { companyId, jobId: job.id },
              include: costLineInclude,
              orderBy: [{ costDate: 'asc' }, { createdAt: 'asc' }],
            })
          : [],
      ]);

    this.assertAllSelectedFound(
      payload.selectedJobReportIds,
      selectedReportsRaw,
      'Ausgewaehlter Auftragsbericht wurde fuer diesen Job nicht gefunden.',
    );
    this.assertAllSelectedFound(
      payload.selectedAttachmentIds,
      selectedAttachmentsRaw,
      'Ausgewaehlter Anhang wurde fuer diesen Job nicht gefunden.',
    );
    this.assertAllSelectedFound(
      payload.selectedCostLineIds,
      selectedCostLinesRaw,
      'Ausgewaehlte Kostenzeile wurde fuer diesen Job nicht gefunden.',
    );

    const ineligibleReport = selectedReportsRaw.find(
      (report) => report.reviewStatus !== 'APPROVED',
    );
    if (ineligibleReport) {
      throw new BadRequestException(
        'Nur freigegebene Auftragsberichte koennen in einen Kundenbericht uebernommen werden.',
      );
    }

    const selectedReports = this.inRequestedOrder(
      payload.selectedJobReportIds,
      selectedReportsRaw,
    );
    const selectedAttachments = this.inRequestedOrder(
      payload.selectedAttachmentIds,
      selectedAttachmentsRaw,
    );
    const selectedCostLines = this.inRequestedOrder(
      payload.selectedCostLineIds,
      selectedCostLinesRaw,
    );
    const capturedAt = new Date().toISOString();
    const customer = mapCustomerReportCustomerSource(job.customer);
    const address = mapCustomerReportAddressSource(job.address);
    const object = mapCustomerReportObjectSource(job.object);
    const objectArea = mapCustomerReportObjectAreaSource(job.objectArea);
    const selectedLineSummary = buildJobCostSummary(selectedCostLines);
    const fullJobSummary = payload.includeFullCostSummary
      ? buildJobCostSummary(allCostLines)
      : undefined;

    const snapshotSourceData: CustomerReportSourceData = {
      schemaVersion: 1,
      capturedAt,
      job: mapCustomerReportJobSource(job),
      customer,
      address,
      object,
      objectArea,
      selectedJobReportIds: payload.selectedJobReportIds,
      selectedAttachmentIds: payload.selectedAttachmentIds,
      selectedCostLineIds: payload.selectedCostLineIds,
      includeFullCostSummary: payload.includeFullCostSummary,
      jobReports: selectedReports.map((report, index) =>
        mapCustomerReportJobReportSource(report, index),
      ),
      attachments: selectedAttachments.map((attachment, index) =>
        mapCustomerReportAttachmentSource(attachment, index),
      ),
    };

    const snapshotCostBreakdown: CustomerReportCostBreakdown = {
      schemaVersion: 1,
      capturedAt,
      includeFullCostSummary: payload.includeFullCostSummary,
      selectedLineSummary,
      selectedLines: selectedCostLines.map((costLine, index) =>
        mapCustomerReportCostLineSnapshot(costLine, index),
      ),
      fullJobSummary,
    };

    const effectiveSummary = fullJobSummary ??
      (selectedCostLines.length ? selectedLineSummary : undefined);

    return {
      job,
      customer,
      address,
      object,
      objectArea,
      snapshotSourceData,
      snapshotCostBreakdown,
      snapshotCostGrandTotal: effectiveSummary?.grandTotal,
      snapshotCostCurrency: effectiveSummary?.currency,
      snapshotCustomerName: customer?.name ?? job.customerName,
      snapshotAddressLabel: address?.label,
      snapshotAddressText: formatSnapshotAddress(address, job.location),
      snapshotObjectName: object?.name,
      snapshotObjectAreaName: objectArea?.name,
      snapshotJobReference: job.reference,
      snapshotJobTitle: job.title,
    };
  }

  private async loadAllJobSources(
    transaction: Prisma.TransactionClient,
    companyId: string,
    jobId: string,
  ) {
    const job = await transaction.job.findFirst({
      where: { id: jobId, companyId },
      include: jobContextInclude,
    });

    if (!job) {
      throw new NotFoundException('Job nicht gefunden.');
    }

    const [jobReports, attachments, costLines] = await Promise.all([
      transaction.jobReport.findMany({
        where: { companyId, jobId: job.id },
        include: jobReportInclude,
        orderBy: [{ createdAt: 'desc' }],
      }),
      transaction.jobAttachment.findMany({
        where: { companyId, jobId: job.id },
        orderBy: [{ createdAt: 'desc' }],
      }),
      transaction.jobCostLine.findMany({
        where: { companyId, jobId: job.id },
        include: costLineInclude,
        orderBy: [{ costDate: 'desc' }, { createdAt: 'desc' }],
      }),
    ]);

    return { job, jobReports, attachments, costLines };
  }

  private assertAllSelectedFound(
    requestedIds: string[],
    records: Array<{ id: string }>,
    message: string,
  ) {
    if (requestedIds.length !== records.length) {
      throw new NotFoundException(message);
    }
  }

  private inRequestedOrder<T extends { id: string }>(requestedIds: string[], records: T[]) {
    const recordsById = new Map(records.map((record) => [record.id, record]));
    return requestedIds.map((id) => recordsById.get(id) as T);
  }
}
