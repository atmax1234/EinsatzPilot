import { Inject, Injectable } from '@nestjs/common';
import { JobActivityKind, PrismaClient } from '@prisma/client';

import type {
  AuthenticatedUser,
  JobReportCreateInput,
  JobReportListResponse,
  RequestAuthContext,
} from '@einsatzpilot/types';

import { PrismaService } from '../prisma/prisma.service';
import { OperationsLookupService } from '../operations/operations-lookup.service';
import {
  assertCanCreateJobReports,
  assertCanReadCompanyArtifacts,
} from '../operations/operations-permissions';
import { mapJobReportItem } from './reports-mapper';
import { normalizeJobReportCreateInput } from './reports-payloads';

@Injectable()
export class ReportsService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(OperationsLookupService)
    private readonly operationsLookupService: OperationsLookupService,
  ) {}

  async listJobReports(
    companyId: string,
    jobId: string,
    authContext: RequestAuthContext,
  ): Promise<JobReportListResponse> {
    assertCanReadCompanyArtifacts(authContext);
    await this.operationsLookupService.getJobForCompanyOrThrow(companyId, jobId);
    const prisma = this.prisma as PrismaClient;

    const reports = await prisma.jobReport.findMany({
      where: {
        companyId,
        jobId,
      },
      include: {
        author: true,
        team: true,
      },
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
        summary: payload.summary,
        details: payload.details,
      },
      include: {
        author: true,
        team: true,
      },
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

    return this.listJobReports(input.companyId, input.jobId, input.authContext);
  }
}
