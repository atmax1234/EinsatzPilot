import { Body, Controller, Get, Inject, Param, Patch, Post, UseGuards } from '@nestjs/common';

import type {
  ActiveCompanyContext,
  ItemCategoryCreateInput,
  ItemCategoryListItem,
  ItemCategoryListResponse,
  ItemCategoryUpdateInput,
  RequestAuthContext,
} from '@einsatzpilot/types';

import { AuthenticatedGuard } from '../common/authenticated.guard';
import { CompanyContextGuard } from '../common/company-context.guard';
import { CurrentAuthContext } from '../common/current-auth-context.decorator';
import { CurrentCompany } from '../common/current-company.decorator';
import { ItemsService } from './items.service';

@Controller('item-categories')
@UseGuards(AuthenticatedGuard, CompanyContextGuard)
export class ItemCategoriesController {
  constructor(
    @Inject(ItemsService)
    private readonly itemsService: ItemsService,
  ) {}

  @Get()
  getCategories(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentAuthContext() authContext: RequestAuthContext,
  ): Promise<ItemCategoryListResponse> {
    return this.itemsService.getCategories({ companyId: company.id, authContext });
  }

  @Post()
  createCategory(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentAuthContext() authContext: RequestAuthContext,
    @Body() payload: ItemCategoryCreateInput,
  ): Promise<ItemCategoryListItem> {
    return this.itemsService.createCategory({ companyId: company.id, authContext, payload });
  }

  @Patch(':categoryId')
  updateCategory(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentAuthContext() authContext: RequestAuthContext,
    @Param('categoryId') categoryId: string,
    @Body() payload: ItemCategoryUpdateInput,
  ): Promise<ItemCategoryListItem> {
    return this.itemsService.updateCategory({
      companyId: company.id,
      categoryId,
      authContext,
      payload,
    });
  }
}
