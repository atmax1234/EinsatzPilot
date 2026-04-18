import { Controller, Get, Inject, UseGuards } from '@nestjs/common';

import type { ActiveCompanyContext, DashboardResponse } from '@einsatzpilot/types';

import { CompanyContextGuard } from '../common/company-context.guard';
import { CurrentCompany } from '../common/current-company.decorator';
import { AuthenticatedGuard } from '../common/authenticated.guard';
import { OperationsService } from './operations.service';

@Controller('dashboard')
@UseGuards(AuthenticatedGuard, CompanyContextGuard)
export class DashboardController {
  constructor(
    @Inject(OperationsService)
    private readonly operationsService: OperationsService,
  ) {}

  @Get()
  getDashboard(@CurrentCompany() company: ActiveCompanyContext): Promise<DashboardResponse> {
    return this.operationsService.getDashboard(company.id);
  }
}
