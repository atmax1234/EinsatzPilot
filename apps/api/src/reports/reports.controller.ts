import { Body, Controller, Get, Inject, Param, Patch, Post, UseGuards } from '@nestjs/common';

import type {
  ActiveCompanyContext,
  AuthenticatedUser,
  JobReportCreateInput,
  JobReportItem,
  JobReportListResponse,
  JobReportReviewInput,
  RequestAuthContext,
} from '@einsatzpilot/types';

import { AuthenticatedGuard } from '../common/authenticated.guard';
import { CompanyContextGuard } from '../common/company-context.guard';
import { CurrentAuthContext } from '../common/current-auth-context.decorator';
import { CurrentCompany } from '../common/current-company.decorator';
import { CurrentUser } from '../common/current-user.decorator';
import { ReportsService } from './reports.service';

@Controller('jobs/:jobId/reports')
@UseGuards(AuthenticatedGuard, CompanyContextGuard)
export class ReportsController {
  constructor(
    @Inject(ReportsService)
    private readonly reportsService: ReportsService,
  ) {}

  @Get()
  listJobReports(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentAuthContext() authContext: RequestAuthContext,
    @Param('jobId') jobId: string,
  ): Promise<JobReportListResponse> {
    return this.reportsService.listJobReports(company.id, jobId, authContext);
  }

  @Post()
  createJobReport(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentUser() user: AuthenticatedUser,
    @CurrentAuthContext() authContext: RequestAuthContext,
    @Param('jobId') jobId: string,
    @Body() payload: JobReportCreateInput,
  ): Promise<JobReportListResponse> {
    return this.reportsService.createJobReport({
      companyId: company.id,
      jobId,
      actor: user,
      authContext,
      payload,
    });
  }

  @Patch(':reportId/review')
  reviewJobReport(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentUser() user: AuthenticatedUser,
    @CurrentAuthContext() authContext: RequestAuthContext,
    @Param('jobId') jobId: string,
    @Param('reportId') reportId: string,
    @Body() payload: JobReportReviewInput,
  ): Promise<JobReportItem> {
    return this.reportsService.reviewJobReport({
      companyId: company.id,
      jobId,
      reportId,
      actor: user,
      authContext,
      payload,
    });
  }
}
