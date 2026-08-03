import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import type {
  ActiveCompanyContext,
  AuthenticatedUser,
  CustomerReportCreateInput,
  CustomerReportDetailResponse,
  CustomerReportListResponse,
  CustomerReportStatusUpdateInput,
  CustomerReportUpdateInput,
  RequestAuthContext,
} from '@einsatzpilot/types';

import { AuthenticatedGuard } from '../common/authenticated.guard';
import { CompanyContextGuard } from '../common/company-context.guard';
import { CurrentAuthContext } from '../common/current-auth-context.decorator';
import { CurrentCompany } from '../common/current-company.decorator';
import { CurrentUser } from '../common/current-user.decorator';
import { CustomerReportsService } from './customer-reports.service';

@Controller('customer-reports')
@UseGuards(AuthenticatedGuard, CompanyContextGuard)
export class CustomerReportsController {
  constructor(
    @Inject(CustomerReportsService)
    private readonly customerReportsService: CustomerReportsService,
  ) {}

  @Get()
  listCustomerReports(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentAuthContext() authContext: RequestAuthContext,
    @Query('jobId') jobId?: string,
    @Query('status') rawStatus?: string,
  ): Promise<CustomerReportListResponse> {
    return this.customerReportsService.listCustomerReports({
      companyId: company.id,
      authContext,
      jobId: jobId?.trim() || undefined,
      rawStatus,
    });
  }

  @Post()
  createCustomerReport(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentUser() actor: AuthenticatedUser,
    @CurrentAuthContext() authContext: RequestAuthContext,
    @Body() payload: CustomerReportCreateInput,
  ): Promise<CustomerReportDetailResponse> {
    return this.customerReportsService.createCustomerReport({
      companyId: company.id,
      actor,
      authContext,
      payload,
    });
  }

  @Get(':reportId')
  getCustomerReport(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentAuthContext() authContext: RequestAuthContext,
    @Param('reportId') reportId: string,
  ): Promise<CustomerReportDetailResponse> {
    return this.customerReportsService.getCustomerReport({
      companyId: company.id,
      reportId,
      authContext,
    });
  }

  @Patch(':reportId')
  updateCustomerReport(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentUser() actor: AuthenticatedUser,
    @CurrentAuthContext() authContext: RequestAuthContext,
    @Param('reportId') reportId: string,
    @Body() payload: CustomerReportUpdateInput,
  ): Promise<CustomerReportDetailResponse> {
    return this.customerReportsService.updateCustomerReport({
      companyId: company.id,
      reportId,
      actor,
      authContext,
      payload,
    });
  }

  @Patch(':reportId/status')
  updateCustomerReportStatus(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentUser() actor: AuthenticatedUser,
    @CurrentAuthContext() authContext: RequestAuthContext,
    @Param('reportId') reportId: string,
    @Body() payload: CustomerReportStatusUpdateInput,
  ): Promise<CustomerReportDetailResponse> {
    return this.customerReportsService.updateCustomerReportStatus({
      companyId: company.id,
      reportId,
      actor,
      authContext,
      payload,
    });
  }
}
