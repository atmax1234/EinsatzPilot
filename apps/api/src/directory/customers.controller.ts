import { Body, Controller, Get, Inject, Param, Patch, Post, UseGuards } from '@nestjs/common';

import type {
  ActiveCompanyContext,
  CustomerCreateInput,
  CustomerListItem,
  CustomerListResponse,
  CustomerUpdateInput,
  RequestAuthContext,
} from '@einsatzpilot/types';

import { AuthenticatedGuard } from '../common/authenticated.guard';
import { CompanyContextGuard } from '../common/company-context.guard';
import { CurrentAuthContext } from '../common/current-auth-context.decorator';
import { CurrentCompany } from '../common/current-company.decorator';
import { DirectoryService } from './directory.service';

@Controller('customers')
@UseGuards(AuthenticatedGuard, CompanyContextGuard)
export class CustomersController {
  constructor(
    @Inject(DirectoryService)
    private readonly directoryService: DirectoryService,
  ) {}

  @Get()
  getCustomers(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentAuthContext() authContext: RequestAuthContext,
  ): Promise<CustomerListResponse> {
    return this.directoryService.getCustomers({ companyId: company.id, authContext });
  }

  @Post()
  createCustomer(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentAuthContext() authContext: RequestAuthContext,
    @Body() payload: CustomerCreateInput,
  ): Promise<CustomerListItem> {
    return this.directoryService.createCustomer({ companyId: company.id, authContext, payload });
  }

  @Patch(':customerId')
  updateCustomer(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentAuthContext() authContext: RequestAuthContext,
    @Param('customerId') customerId: string,
    @Body() payload: CustomerUpdateInput,
  ): Promise<CustomerListItem> {
    return this.directoryService.updateCustomer({
      companyId: company.id,
      customerId,
      authContext,
      payload,
    });
  }
}
