import { Body, Controller, Get, Inject, Param, Patch, Post, UseGuards } from '@nestjs/common';

import type {
  ActiveCompanyContext,
  ObjectAreaCreateInput,
  ObjectAreaItem,
  ObjectAreaListResponse,
  ObjectAreaUpdateInput,
  ObjectCreateInput,
  ObjectDetailResponse,
  ObjectListItem,
  ObjectListResponse,
  ObjectUpdateInput,
  RequestAuthContext,
} from '@einsatzpilot/types';

import { AuthenticatedGuard } from '../common/authenticated.guard';
import { CompanyContextGuard } from '../common/company-context.guard';
import { CurrentAuthContext } from '../common/current-auth-context.decorator';
import { CurrentCompany } from '../common/current-company.decorator';
import { DirectoryService } from './directory.service';

@Controller('objects')
@UseGuards(AuthenticatedGuard, CompanyContextGuard)
export class ObjectsController {
  constructor(
    @Inject(DirectoryService)
    private readonly directoryService: DirectoryService,
  ) {}

  @Get()
  getObjects(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentAuthContext() authContext: RequestAuthContext,
  ): Promise<ObjectListResponse> {
    return this.directoryService.getObjects({ companyId: company.id, authContext });
  }

  @Post()
  createObject(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentAuthContext() authContext: RequestAuthContext,
    @Body() payload: ObjectCreateInput,
  ): Promise<ObjectListItem> {
    return this.directoryService.createObject({ companyId: company.id, authContext, payload });
  }

  @Get(':objectId/areas')
  getObjectAreas(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentAuthContext() authContext: RequestAuthContext,
    @Param('objectId') objectId: string,
  ): Promise<ObjectAreaListResponse> {
    return this.directoryService.getObjectAreas({ companyId: company.id, objectId, authContext });
  }

  @Post(':objectId/areas')
  createObjectArea(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentAuthContext() authContext: RequestAuthContext,
    @Param('objectId') objectId: string,
    @Body() payload: ObjectAreaCreateInput,
  ): Promise<ObjectAreaItem> {
    return this.directoryService.createObjectArea({
      companyId: company.id,
      objectId,
      authContext,
      payload,
    });
  }

  @Patch(':objectId/areas/:areaId')
  updateObjectArea(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentAuthContext() authContext: RequestAuthContext,
    @Param('objectId') objectId: string,
    @Param('areaId') areaId: string,
    @Body() payload: ObjectAreaUpdateInput,
  ): Promise<ObjectAreaItem> {
    return this.directoryService.updateObjectArea({
      companyId: company.id,
      objectId,
      areaId,
      authContext,
      payload,
    });
  }

  @Get(':objectId')
  getObjectDetail(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentAuthContext() authContext: RequestAuthContext,
    @Param('objectId') objectId: string,
  ): Promise<ObjectDetailResponse> {
    return this.directoryService.getObjectDetail({ companyId: company.id, objectId, authContext });
  }

  @Patch(':objectId')
  updateObject(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentAuthContext() authContext: RequestAuthContext,
    @Param('objectId') objectId: string,
    @Body() payload: ObjectUpdateInput,
  ): Promise<ObjectListItem> {
    return this.directoryService.updateObject({
      companyId: company.id,
      objectId,
      authContext,
      payload,
    });
  }
}
