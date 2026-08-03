import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JobActivityKind, Prisma } from '@prisma/client';

import { parseCustomerReportStatus } from '@einsatzpilot/schemas';
import type {
  AuthenticatedUser,
  CustomerReportCreateInput,
  CustomerReportDetailResponse,
  CustomerReportListResponse,
  CustomerReportStatus,
  CustomerReportStatusUpdateInput,
  CustomerReportUpdateInput,
  RequestAuthContext,
} from '@einsatzpilot/types';

import {
  assertCanReadCustomerReports,
  assertCanWriteCustomerReports,
} from '../operations/operations-permissions';
import { PrismaService } from '../prisma/prisma.service';
import { generateCustomerReportNumber } from './customer-report-number';
import {
  assertCustomerReportUpdatePeriod,
  normalizeCustomerReportCreateInput,
  normalizeCustomerReportStatusInput,
  normalizeCustomerReportUpdateInput,
} from './customer-report-payloads';
import { CustomerReportSourceService } from './customer-report-source.service';
import {
  assertCustomerReportSnapshotConsistency,
  parseCustomerReportCostBreakdown,
  parseCustomerReportSourceData,
} from './customer-report-snapshot';
import {
  assertCustomerReportDraft,
  assertCustomerReportStatusTransition,
} from './customer-report-status-rules';
import {
  mapCustomerReportDetail,
  mapCustomerReportListItem,
} from './customer-reports-mapper';

const customerReportInclude = {
  createdBy: {
    select: { id: true, email: true, displayName: true },
  },
  approvedBy: {
    select: { id: true, email: true, displayName: true },
  },
} satisfies Prisma.CustomerReportSnapshotInclude;

const statusActivityLabels: Record<CustomerReportStatus, string> = {
  DRAFT: 'in den Entwurf zurueckgesetzt',
  READY_FOR_REVIEW: 'zur Pruefung bereitgestellt',
  APPROVED: 'freigegeben',
  ARCHIVED: 'archiviert',
};

function toJsonInput(value: object) {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

@Injectable()
export class CustomerReportsService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(CustomerReportSourceService)
    private readonly customerReportSourceService: CustomerReportSourceService,
  ) {}

  async listCustomerReports(input: {
    companyId: string;
    authContext: RequestAuthContext;
    jobId?: string;
    rawStatus?: string;
  }): Promise<CustomerReportListResponse> {
    assertCanReadCustomerReports(input.authContext);
    const status = parseCustomerReportStatus(input.rawStatus);
    if (input.rawStatus && !status) {
      throw new BadRequestException('status ist ungueltig.');
    }

    const reports = await this.prisma.customerReportSnapshot.findMany({
      where: {
        companyId: input.companyId,
        jobId: input.jobId,
        status,
      },
      include: customerReportInclude,
      orderBy: [{ createdAt: 'desc' }],
    });

    return { customerReports: reports.map(mapCustomerReportListItem) };
  }

  async getCustomerReport(input: {
    companyId: string;
    reportId: string;
    authContext: RequestAuthContext;
  }): Promise<CustomerReportDetailResponse> {
    assertCanReadCustomerReports(input.authContext);
    const report = await this.getReportForCompanyOrThrow(
      this.prisma,
      input.companyId,
      input.reportId,
    );

    return { customerReport: mapCustomerReportDetail(report) };
  }

  async createCustomerReport(input: {
    companyId: string;
    actor: AuthenticatedUser;
    authContext: RequestAuthContext;
    payload: CustomerReportCreateInput;
  }): Promise<CustomerReportDetailResponse> {
    assertCanWriteCustomerReports(input.authContext);
    const payload = normalizeCustomerReportCreateInput(input.payload);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const reportNumber = generateCustomerReportNumber();

      try {
        const report = await this.prisma.$transaction(
          async (transaction) => {
            const snapshot = await this.customerReportSourceService.buildSnapshot(
              transaction,
              input.companyId,
              payload,
            );

            const created = await transaction.customerReportSnapshot.create({
              data: {
                companyId: input.companyId,
                reportNumber,
                jobId: snapshot.job.id,
                customerId: snapshot.customer?.id,
                addressId: snapshot.address?.id,
                objectId: snapshot.object?.id,
                objectAreaId: snapshot.objectArea?.id,
                type: payload.type,
                title: payload.title,
                recipientName: payload.recipientName,
                periodStart: payload.periodStart,
                periodEnd: payload.periodEnd,
                issueSummary: payload.issueSummary,
                findingSummary: payload.findingSummary,
                workPerformedSummary: payload.workPerformedSummary,
                workStillNeededSummary: payload.workStillNeededSummary,
                followUpSummary: payload.followUpSummary,
                costSummaryText: payload.costSummaryText,
                internalNotes: payload.internalNotes,
                snapshotCustomerName: snapshot.snapshotCustomerName,
                snapshotAddressLabel: snapshot.snapshotAddressLabel,
                snapshotAddressText: snapshot.snapshotAddressText,
                snapshotObjectName: snapshot.snapshotObjectName,
                snapshotObjectAreaName: snapshot.snapshotObjectAreaName,
                snapshotJobReference: snapshot.snapshotJobReference,
                snapshotJobTitle: snapshot.snapshotJobTitle,
                snapshotCostGrandTotal: snapshot.snapshotCostGrandTotal,
                snapshotCostCurrency: snapshot.snapshotCostCurrency,
                snapshotCostBreakdown: toJsonInput(snapshot.snapshotCostBreakdown),
                snapshotSourceData: toJsonInput(snapshot.snapshotSourceData),
                createdByUserId: input.actor.id,
              },
              include: customerReportInclude,
            });

            await transaction.jobActivity.create({
              data: {
                jobId: snapshot.job.id,
                kind: JobActivityKind.REPORT,
                title: `Kundenbericht erstellt: ${reportNumber}`,
                content: payload.title,
                authorName: input.actor.displayName ?? input.actor.email,
              },
            });

            return created;
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
        );

        return { customerReport: mapCustomerReportDetail(report) };
      } catch (error) {
        if (this.isReportNumberCollision(error)) {
          continue;
        }

        throw error;
      }
    }

    throw new ConflictException(
      'Kundenberichtsnummer konnte nach mehreren Versuchen nicht eindeutig erzeugt werden.',
    );
  }

  async updateCustomerReport(input: {
    companyId: string;
    reportId: string;
    actor: AuthenticatedUser;
    authContext: RequestAuthContext;
    payload: CustomerReportUpdateInput;
  }): Promise<CustomerReportDetailResponse> {
    assertCanWriteCustomerReports(input.authContext);
    const payload = normalizeCustomerReportUpdateInput(input.payload);

    const updated = await this.prisma.$transaction(async (transaction) => {
      const report = await this.getReportForCompanyOrThrow(
        transaction,
        input.companyId,
        input.reportId,
      );
      assertCustomerReportDraft(report.status);

      const periodStart =
        payload.periodStart === undefined ? report.periodStart : payload.periodStart;
      const periodEnd = payload.periodEnd === undefined ? report.periodEnd : payload.periodEnd;
      assertCustomerReportUpdatePeriod({ periodStart, periodEnd });

      const result = await transaction.customerReportSnapshot.updateMany({
        where: {
          id: report.id,
          companyId: input.companyId,
          status: 'DRAFT',
          updatedAt: report.updatedAt,
        },
        data: payload,
      });

      if (result.count !== 1) {
        throw new ConflictException(
          'Kundenbericht wurde gleichzeitig geaendert; bitte neu laden.',
        );
      }

      return this.getReportForCompanyOrThrow(transaction, input.companyId, report.id);
    });

    return { customerReport: mapCustomerReportDetail(updated) };
  }

  async updateCustomerReportStatus(input: {
    companyId: string;
    reportId: string;
    actor: AuthenticatedUser;
    authContext: RequestAuthContext;
    payload: CustomerReportStatusUpdateInput;
  }): Promise<CustomerReportDetailResponse> {
    assertCanWriteCustomerReports(input.authContext);
    const payload = normalizeCustomerReportStatusInput(input.payload);

    const updated = await this.prisma.$transaction(async (transaction) => {
      const report = await this.getReportForCompanyOrThrow(
        transaction,
        input.companyId,
        input.reportId,
      );
      assertCustomerReportStatusTransition(report.status, payload.status);

      if (payload.status === 'READY_FOR_REVIEW') {
        this.assertReadyForReviewContent(report);
      }

      const result = await transaction.customerReportSnapshot.updateMany({
        where: {
          id: report.id,
          companyId: input.companyId,
          status: report.status,
          updatedAt: report.updatedAt,
        },
        data: {
          status: payload.status,
          approvedByUserId:
            payload.status === 'APPROVED' ? input.actor.id : report.approvedByUserId,
          approvedAt: payload.status === 'APPROVED' ? new Date() : report.approvedAt,
        },
      });

      if (result.count !== 1) {
        throw new ConflictException(
          'Kundenberichtsstatus wurde gleichzeitig geaendert; bitte neu laden.',
        );
      }

      if (report.jobId) {
        await transaction.jobActivity.create({
          data: {
            jobId: report.jobId,
            kind: JobActivityKind.REPORT,
            title: `Kundenbericht ${statusActivityLabels[payload.status]}: ${report.reportNumber}`,
            content: report.title,
            authorName: input.actor.displayName ?? input.actor.email,
          },
        });
      }

      return this.getReportForCompanyOrThrow(transaction, input.companyId, report.id);
    });

    return { customerReport: mapCustomerReportDetail(updated) };
  }

  private async getReportForCompanyOrThrow(
    client: Prisma.TransactionClient,
    companyId: string,
    reportId: string,
  ) {
    const report = await client.customerReportSnapshot.findFirst({
      where: { id: reportId, companyId },
      include: customerReportInclude,
    });

    if (!report) {
      throw new NotFoundException('Kundenbericht nicht gefunden.');
    }

    return report;
  }

  private assertReadyForReviewContent(report: {
    issueSummary: string | null;
    findingSummary: string | null;
    workPerformedSummary: string | null;
    workStillNeededSummary: string | null;
    followUpSummary: string | null;
    costSummaryText: string | null;
    snapshotSourceData: unknown;
    snapshotCostBreakdown: unknown;
  }) {
    const sources = parseCustomerReportSourceData(report.snapshotSourceData);
    const costs =
      report.snapshotCostBreakdown == null
        ? undefined
        : parseCustomerReportCostBreakdown(report.snapshotCostBreakdown);
    assertCustomerReportSnapshotConsistency(sources, costs);
    const hasAuthoredContent = [
      report.issueSummary,
      report.findingSummary,
      report.workPerformedSummary,
      report.workStillNeededSummary,
      report.followUpSummary,
      report.costSummaryText,
    ].some((value) => Boolean(value?.trim()));
    const hasSources = sources.jobReports.length > 0 || sources.attachments.length > 0;
    const hasCosts =
      Boolean(costs?.selectedLines.length) || Boolean(costs?.fullJobSummary?.lineCount);

    if (!hasAuthoredContent && !hasSources && !hasCosts) {
      throw new BadRequestException(
        'Vor der Pruefung braucht der Kundenbericht Inhalt oder ausgewaehlte Quellen.',
      );
    }
  }

  private isReportNumberCollision(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}
