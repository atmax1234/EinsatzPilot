import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { JobActivityKind, PrismaClient } from '@prisma/client';

import type {
  AuthenticatedUser,
  JobReportCreateInput,
  JobReportItem,
  JobReportListResponse,
  JobReportReviewInput,
  RequestAuthContext,
} from '@einsatzpilot/types';

import { PrismaService } from '../prisma/prisma.service';
import { OperationsLookupService } from '../operations/operations-lookup.service';
import { JobAccessService } from '../operations/job-access.service';
import {
  assertCanCreateJobReports,
  assertCanReadCompanyArtifacts,
  assertCanReviewJobReports,
} from '../operations/operations-permissions';
import { assertReportReviewTransition } from './report-review-rules';
import { jobReportInclude, mapJobReportItem } from './reports-mapper';
import {
  normalizeJobReportCreateInput,
  normalizeJobReportReviewInput,
} from './reports-payloads';

const reviewActivityLabels = {
  APPROVED: 'freigegeben',
  NEEDS_REVISION: 'zur Ueberarbeitung zurueckgegeben',
  REJECTED: 'abgelehnt',
} as const;

@Injectable()
export class ReportsService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(OperationsLookupService)
    private readonly operationsLookupService: OperationsLookupService,
    @Inject(JobAccessService)
    private readonly jobAccessService: JobAccessService,
  ) {}

  async listJobReports(
    companyId: string,
    jobId: string,
    actor: AuthenticatedUser,
    authContext: RequestAuthContext,
  ): Promise<JobReportListResponse> {
    assertCanReadCompanyArtifacts(authContext);
    const job = await this.operationsLookupService.getJobForCompanyOrThrow(companyId, jobId);
    await this.jobAccessService.assertWorkerCanReadJob({
      companyId,
      jobId: job.id,
      userId: actor.id,
      authContext,
    });
    const prisma = this.prisma as PrismaClient;

    const reports = await prisma.jobReport.findMany({
      where: {
        companyId,
        jobId,
      },
      include: jobReportInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      reports: reports.map((report) => mapJobReportItem(report)),
    };
  }

  async createJobReport(input: {
    companyId: string;
    jobId: string;
    actor: AuthenticatedUser;
    authContext: RequestAuthContext;
    payload: JobReportCreateInput;
  }): Promise<JobReportListResponse> {
    assertCanCreateJobReports(input.authContext);

    const payload = normalizeJobReportCreateInput(input.payload);
    const job = await this.operationsLookupService.getJobForCompanyOrThrow(input.companyId, input.jobId);
    const prisma = this.prisma as PrismaClient;

    await this.jobAccessService.assertWorkerCanContributeToJob({
      companyId: input.companyId,
      jobId: job.id,
      userId: input.actor.id,
      authContext: input.authContext,
    });

    const team =
      payload.teamId === undefined
        ? job.team
        : payload.teamId
          ? await this.operationsLookupService.getTeamForCompanyOrThrow(input.companyId, payload.teamId)
          : null;

    const report = await prisma.jobReport.create({
      data: {
        companyId: input.companyId,
        jobId: job.id,
        teamId: team?.id,
        authorUserId: input.actor.id,
        type: payload.type,
        summary: payload.summary,
        details: payload.details,
        findingSummary: payload.findingSummary,
        workPerformed: payload.workPerformed,
        workStillNeeded: payload.workStillNeeded,
        followUpRequired: payload.followUpRequired,
        followUpNotes: payload.followUpNotes,
        reviewStatus: payload.type === 'GENERAL' ? 'SUBMITTED' : 'PENDING_REVIEW',
      },
      include: jobReportInclude,
    });

    await prisma.jobActivity.create({
      data: {
        jobId: job.id,
        kind: JobActivityKind.REPORT,
        title: `Bericht erfasst: ${report.summary}`,
        content: report.details ?? undefined,
        authorName: input.actor.displayName ?? input.actor.email,
      },
    });

    const response = await this.listJobReports(
      input.companyId,
      input.jobId,
      input.actor,
      input.authContext,
    );

    return {
      ...response,
      createdReport: mapJobReportItem(report),
    };
  }

  async reviewJobReport(input: {
    companyId: string;
    jobId: string;
    reportId: string;
    actor: AuthenticatedUser;
    authContext: RequestAuthContext;
    payload: JobReportReviewInput;
  }): Promise<JobReportItem> {
    assertCanReviewJobReports(input.authContext);
    const payload = normalizeJobReportReviewInput(input.payload);
    const job = await this.operationsLookupService.getJobForCompanyOrThrow(
      input.companyId,
      input.jobId,
    );
    const report = await this.getReportForCompanyJobOrThrow({
      companyId: input.companyId,
      jobId: job.id,
      reportId: input.reportId,
    });

    assertReportReviewTransition(report.reviewStatus, payload.reviewStatus);

    const [updatedReport] = await this.prisma.$transaction([
      this.prisma.jobReport.update({
        where: { id: report.id },
        data: {
          reviewStatus: payload.reviewStatus,
          reviewNotes: payload.reviewNotes,
          reviewedByUserId: input.actor.id,
          reviewedAt: new Date(),
        },
        include: jobReportInclude,
      }),
      this.prisma.jobActivity.create({
        data: {
          jobId: job.id,
          kind: JobActivityKind.REPORT,
          title: `Bericht ${reviewActivityLabels[payload.reviewStatus]}: ${report.summary}`,
          content: payload.reviewNotes,
          authorName: input.actor.displayName ?? input.actor.email,
        },
      }),
    ]);

    return mapJobReportItem(updatedReport);
  }

  private async getReportForCompanyJobOrThrow(input: {
    companyId: string;
    jobId: string;
    reportId: string;
  }) {
    const report = await this.prisma.jobReport.findFirst({
      where: {
        id: input.reportId,
        companyId: input.companyId,
        jobId: input.jobId,
      },
      include: jobReportInclude,
    });

    if (!report) {
      throw new NotFoundException('Bericht fuer diesen Auftrag nicht gefunden.');
    }

    return report;
  }

}
