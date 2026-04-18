import { Body, Controller, Get, Inject, Param, Patch, Post, UseGuards } from '@nestjs/common';

import type {
  ActiveCompanyContext,
  AuthenticatedUser,
  JobCreateInput,
  JobDetailResponse,
  JobListResponse,
  JobStatusTransitionInput,
  JobUpdateInput,
  RequestAuthContext,
} from '@einsatzpilot/types';

import { AuthenticatedGuard } from '../common/authenticated.guard';
import { CompanyContextGuard } from '../common/company-context.guard';
import { CurrentAuthContext } from '../common/current-auth-context.decorator';
import { CurrentCompany } from '../common/current-company.decorator';
import { CurrentUser } from '../common/current-user.decorator';
import { OperationsService } from './operations.service';
import { OperationsWriteService } from './operations-write.service';

@Controller('jobs')
@UseGuards(AuthenticatedGuard, CompanyContextGuard)
export class JobsController {
  constructor(
    @Inject(OperationsService)
    private readonly operationsService: OperationsService,
    @Inject(OperationsWriteService)
    private readonly operationsWriteService: OperationsWriteService,
  ) {}

  @Get()
  getJobs(@CurrentCompany() company: ActiveCompanyContext): Promise<JobListResponse> {
    return this.operationsService.getJobs(company.id);
  }

  @Get(':jobId')
  getJobDetail(
    @CurrentCompany() company: ActiveCompanyContext,
    @Param('jobId') jobId: string,
  ): Promise<JobDetailResponse> {
    return this.operationsService.getJobDetail(company.id, jobId);
  }

  @Post()
  createJob(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentUser() user: AuthenticatedUser,
    @CurrentAuthContext() authContext: RequestAuthContext,
    @Body() payload: JobCreateInput,
  ): Promise<JobDetailResponse> {
    return this.operationsWriteService.createJob({
      companyId: company.id,
      actor: user,
      authContext,
      payload,
    });
  }

  @Patch(':jobId')
  updateJob(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentUser() user: AuthenticatedUser,
    @CurrentAuthContext() authContext: RequestAuthContext,
    @Param('jobId') jobId: string,
    @Body() payload: JobUpdateInput,
  ): Promise<JobDetailResponse> {
    return this.operationsWriteService.updateJob({
      companyId: company.id,
      jobId,
      actor: user,
      authContext,
      payload,
    });
  }

  @Patch(':jobId/status')
  transitionJobStatus(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentUser() user: AuthenticatedUser,
    @CurrentAuthContext() authContext: RequestAuthContext,
    @Param('jobId') jobId: string,
    @Body() payload: JobStatusTransitionInput,
  ): Promise<JobDetailResponse> {
    return this.operationsWriteService.transitionJobStatus({
      companyId: company.id,
      jobId,
      actor: user,
      authContext,
      payload,
    });
  }
}
