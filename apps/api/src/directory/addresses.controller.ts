import { Body, Controller, Get, Inject, Param, Patch, Post, UseGuards } from '@nestjs/common';

import type {
  ActiveCompanyContext,
  AddressCreateInput,
  AddressListItem,
  AddressListResponse,
  AddressUpdateInput,
  RequestAuthContext,
} from '@einsatzpilot/types';

import { AuthenticatedGuard } from '../common/authenticated.guard';
import { CompanyContextGuard } from '../common/company-context.guard';
import { CurrentAuthContext } from '../common/current-auth-context.decorator';
import { CurrentCompany } from '../common/current-company.decorator';
import { DirectoryService } from './directory.service';

@Controller('addresses')
@UseGuards(AuthenticatedGuard, CompanyContextGuard)
export class AddressesController {
  constructor(
    @Inject(DirectoryService)
    private readonly directoryService: DirectoryService,
  ) {}

  @Get()
  getAddresses(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentAuthContext() authContext: RequestAuthContext,
  ): Promise<AddressListResponse> {
    return this.directoryService.getAddresses({ companyId: company.id, authContext });
  }

  @Post()
  createAddress(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentAuthContext() authContext: RequestAuthContext,
    @Body() payload: AddressCreateInput,
  ): Promise<AddressListItem> {
    return this.directoryService.createAddress({ companyId: company.id, authContext, payload });
  }

  @Patch(':addressId')
  updateAddress(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentAuthContext() authContext: RequestAuthContext,
    @Param('addressId') addressId: string,
    @Body() payload: AddressUpdateInput,
  ): Promise<AddressListItem> {
    return this.directoryService.updateAddress({
      companyId: company.id,
      addressId,
      authContext,
      payload,
    });
  }
}
