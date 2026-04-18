import { Controller, Get, Inject, UseGuards } from '@nestjs/common';

import type { ActiveCompanyContext, CompanyMemberListResponse } from '@einsatzpilot/types';

import { AuthenticatedGuard } from '../common/authenticated.guard';
import { CompanyContextGuard } from '../common/company-context.guard';
import { CurrentCompany } from '../common/current-company.decorator';
import { OperationsService } from './operations.service';

@Controller('company-members')
@UseGuards(AuthenticatedGuard, CompanyContextGuard)
export class CompanyMembersController {
  constructor(
    @Inject(OperationsService)
    private readonly operationsService: OperationsService,
  ) {}

  @Get()
  getCompanyMembers(
    @CurrentCompany() company: ActiveCompanyContext,
  ): Promise<CompanyMemberListResponse> {
    return this.operationsService.getCompanyMembers(company.id);
  }
}
