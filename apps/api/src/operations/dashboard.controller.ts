import { Controller, Get, Inject, UseGuards } from '@nestjs/common';

import type {
  ActiveCompanyContext,
  AuthenticatedUser,
  DashboardResponse,
  RequestAuthContext,
} from '@einsatzpilot/types';

import { CompanyContextGuard } from '../common/company-context.guard';
import { CurrentAuthContext } from '../common/current-auth-context.decorator';
import { CurrentCompany } from '../common/current-company.decorator';
import { CurrentUser } from '../common/current-user.decorator';
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
  getDashboard(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentUser() actor: AuthenticatedUser,
    @CurrentAuthContext() authContext: RequestAuthContext,
  ): Promise<DashboardResponse> {
    return this.operationsService.getDashboard({
      companyId: company.id,
      actor,
      authContext,
    });
  }
}
