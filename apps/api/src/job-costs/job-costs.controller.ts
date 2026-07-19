import { Body, Controller, Get, Inject, Param, Patch, Post, UseGuards } from '@nestjs/common';

import type {
  ActiveCompanyContext,
  AuthenticatedUser,
  JobCostCreateInput,
  JobCostLineItem,
  JobCostListResponse,
  JobCostSummary,
  JobCostUpdateInput,
  RequestAuthContext,
} from '@einsatzpilot/types';

import { AuthenticatedGuard } from '../common/authenticated.guard';
import { CompanyContextGuard } from '../common/company-context.guard';
import { CurrentAuthContext } from '../common/current-auth-context.decorator';
import { CurrentCompany } from '../common/current-company.decorator';
import { CurrentUser } from '../common/current-user.decorator';
import { JobCostsService } from './job-costs.service';

@Controller('jobs/:jobId')
@UseGuards(AuthenticatedGuard, CompanyContextGuard)
export class JobCostsController {
  constructor(
    @Inject(JobCostsService)
    private readonly jobCostsService: JobCostsService,
  ) {}

  @Get('costs')
  getJobCosts(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentAuthContext() authContext: RequestAuthContext,
    @Param('jobId') jobId: string,
  ): Promise<JobCostListResponse> {
    return this.jobCostsService.getJobCosts({ companyId: company.id, jobId, authContext });
  }

  @Get('cost-summary')
  getJobCostSummary(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentAuthContext() authContext: RequestAuthContext,
    @Param('jobId') jobId: string,
  ): Promise<JobCostSummary> {
    return this.jobCostsService.getJobCostSummary({
      companyId: company.id,
      jobId,
      authContext,
    });
  }

  @Post('costs')
  createJobCost(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentUser() actor: AuthenticatedUser,
    @CurrentAuthContext() authContext: RequestAuthContext,
    @Param('jobId') jobId: string,
    @Body() payload: JobCostCreateInput,
  ): Promise<JobCostLineItem> {
    return this.jobCostsService.createJobCost({
      companyId: company.id,
      jobId,
      actor,
      authContext,
      payload,
    });
  }

  @Patch('costs/:costLineId')
  updateJobCost(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentUser() actor: AuthenticatedUser,
    @CurrentAuthContext() authContext: RequestAuthContext,
    @Param('jobId') jobId: string,
    @Param('costLineId') costLineId: string,
    @Body() payload: JobCostUpdateInput,
  ): Promise<JobCostLineItem> {
    return this.jobCostsService.updateJobCost({
      companyId: company.id,
      jobId,
      costLineId,
      actor,
      authContext,
      payload,
    });
  }
}
