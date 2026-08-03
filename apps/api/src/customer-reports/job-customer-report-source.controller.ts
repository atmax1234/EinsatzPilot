import { Controller, Get, Inject, Param, UseGuards } from '@nestjs/common';

import type {
  ActiveCompanyContext,
  CustomerReportSourceDataResponse,
  RequestAuthContext,
} from '@einsatzpilot/types';

import { AuthenticatedGuard } from '../common/authenticated.guard';
import { CompanyContextGuard } from '../common/company-context.guard';
import { CurrentAuthContext } from '../common/current-auth-context.decorator';
import { CurrentCompany } from '../common/current-company.decorator';
import { CustomerReportSourceService } from './customer-report-source.service';

@Controller('jobs/:jobId/customer-report-source-data')
@UseGuards(AuthenticatedGuard, CompanyContextGuard)
export class JobCustomerReportSourceController {
  constructor(
    @Inject(CustomerReportSourceService)
    private readonly customerReportSourceService: CustomerReportSourceService,
  ) {}

  @Get()
  getSourceData(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentAuthContext() authContext: RequestAuthContext,
    @Param('jobId') jobId: string,
  ): Promise<CustomerReportSourceDataResponse> {
    return this.customerReportSourceService.getJobCustomerReportSourceData({
      companyId: company.id,
      jobId,
      authContext,
    });
  }
}
