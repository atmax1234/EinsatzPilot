import { Body, Controller, Get, Inject, Param, Patch, Post, UseGuards } from '@nestjs/common';

import type {
  ActiveCompanyContext,
  ItemCreateInput,
  ItemDetailResponse,
  ItemListItem,
  ItemListResponse,
  ItemUpdateInput,
  RequestAuthContext,
} from '@einsatzpilot/types';

import { AuthenticatedGuard } from '../common/authenticated.guard';
import { CompanyContextGuard } from '../common/company-context.guard';
import { CurrentAuthContext } from '../common/current-auth-context.decorator';
import { CurrentCompany } from '../common/current-company.decorator';
import { ItemsService } from './items.service';

@Controller('items')
@UseGuards(AuthenticatedGuard, CompanyContextGuard)
export class ItemsController {
  constructor(
    @Inject(ItemsService)
    private readonly itemsService: ItemsService,
  ) {}

  @Get()
  getItems(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentAuthContext() authContext: RequestAuthContext,
  ): Promise<ItemListResponse> {
    return this.itemsService.getItems({ companyId: company.id, authContext });
  }

  @Post()
  createItem(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentAuthContext() authContext: RequestAuthContext,
    @Body() payload: ItemCreateInput,
  ): Promise<ItemListItem> {
    return this.itemsService.createItem({ companyId: company.id, authContext, payload });
  }

  @Get(':itemId')
  getItemDetail(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentAuthContext() authContext: RequestAuthContext,
    @Param('itemId') itemId: string,
  ): Promise<ItemDetailResponse> {
    return this.itemsService.getItemDetail({ companyId: company.id, itemId, authContext });
  }

  @Patch(':itemId')
  updateItem(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentAuthContext() authContext: RequestAuthContext,
    @Param('itemId') itemId: string,
    @Body() payload: ItemUpdateInput,
  ): Promise<ItemListItem> {
    return this.itemsService.updateItem({
      companyId: company.id,
      itemId,
      authContext,
      payload,
    });
  }
}
