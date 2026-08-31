import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import type {
  ActiveCompanyContext,
  AuthenticatedUser,
  RequestAuthContext,
  WorkdaySheetCreateInput,
  WorkdaySheetDetailResponse,
  WorkdaySheetListResponse,
  WorkdaySheetOptionsResponse,
  WorkdaySheetRowCreateInput,
  WorkdaySheetRowUpdateInput,
  WorkdaySheetStatusUpdateInput,
  WorkdaySheetUpdateInput,
} from '@einsatzpilot/types';

import { AuthenticatedGuard } from '../common/authenticated.guard';
import { CompanyContextGuard } from '../common/company-context.guard';
import { CurrentAuthContext } from '../common/current-auth-context.decorator';
import { CurrentCompany } from '../common/current-company.decorator';
import { CurrentUser } from '../common/current-user.decorator';
import { WorkdaySheetsService } from './workday-sheets.service';

@Controller('workday-sheets')
@UseGuards(AuthenticatedGuard, CompanyContextGuard)
export class WorkdaySheetsController {
  constructor(
    @Inject(WorkdaySheetsService)
    private readonly workdaySheetsService: WorkdaySheetsService,
  ) {}

  @Get()
  getWorkdaySheets(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentUser() actor: AuthenticatedUser,
    @CurrentAuthContext() authContext: RequestAuthContext,
  ): Promise<WorkdaySheetListResponse> {
    return this.workdaySheetsService.getWorkdaySheets({
      companyId: company.id,
      actor,
      authContext,
    });
  }

  @Get('options')
  getOptions(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentAuthContext() authContext: RequestAuthContext,
  ): Promise<WorkdaySheetOptionsResponse> {
    return this.workdaySheetsService.getOptions({ companyId: company.id, authContext });
  }

  @Post()
  createWorkdaySheet(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentUser() actor: AuthenticatedUser,
    @CurrentAuthContext() authContext: RequestAuthContext,
    @Body() payload: WorkdaySheetCreateInput,
  ): Promise<WorkdaySheetDetailResponse> {
    return this.workdaySheetsService.createWorkdaySheet({
      companyId: company.id,
      actor,
      authContext,
      payload,
    });
  }

  @Get(':sheetId')
  getWorkdaySheetDetail(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentUser() actor: AuthenticatedUser,
    @CurrentAuthContext() authContext: RequestAuthContext,
    @Param('sheetId') sheetId: string,
  ): Promise<WorkdaySheetDetailResponse> {
    return this.workdaySheetsService.getWorkdaySheetDetail({
      companyId: company.id,
      sheetId,
      actor,
      authContext,
    });
  }

  @Patch(':sheetId')
  updateWorkdaySheet(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentAuthContext() authContext: RequestAuthContext,
    @Param('sheetId') sheetId: string,
    @Body() payload: WorkdaySheetUpdateInput,
  ): Promise<WorkdaySheetDetailResponse> {
    return this.workdaySheetsService.updateWorkdaySheet({
      companyId: company.id,
      sheetId,
      authContext,
      payload,
    });
  }

  @Post(':sheetId/rows')
  addWorkdaySheetRow(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentAuthContext() authContext: RequestAuthContext,
    @Param('sheetId') sheetId: string,
    @Body() payload: WorkdaySheetRowCreateInput,
  ): Promise<WorkdaySheetDetailResponse> {
    return this.workdaySheetsService.addWorkdaySheetRow({
      companyId: company.id,
      sheetId,
      authContext,
      payload,
    });
  }

  @Patch(':sheetId/rows/:rowId')
  updateWorkdaySheetRow(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentUser() actor: AuthenticatedUser,
    @CurrentAuthContext() authContext: RequestAuthContext,
    @Param('sheetId') sheetId: string,
    @Param('rowId') rowId: string,
    @Body() payload: WorkdaySheetRowUpdateInput,
  ): Promise<WorkdaySheetDetailResponse> {
    return this.workdaySheetsService.updateWorkdaySheetRow({
      companyId: company.id,
      sheetId,
      rowId,
      actor,
      authContext,
      payload,
    });
  }

  @Delete(':sheetId/rows/:rowId')
  deleteWorkdaySheetRow(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentAuthContext() authContext: RequestAuthContext,
    @Param('sheetId') sheetId: string,
    @Param('rowId') rowId: string,
  ): Promise<WorkdaySheetDetailResponse> {
    return this.workdaySheetsService.deleteWorkdaySheetRow({
      companyId: company.id,
      sheetId,
      rowId,
      authContext,
    });
  }

  @Patch(':sheetId/status')
  transitionStatus(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentUser() actor: AuthenticatedUser,
    @CurrentAuthContext() authContext: RequestAuthContext,
    @Param('sheetId') sheetId: string,
    @Body() payload: WorkdaySheetStatusUpdateInput,
  ): Promise<WorkdaySheetDetailResponse> {
    return this.workdaySheetsService.transitionStatus({
      companyId: company.id,
      sheetId,
      actor,
      authContext,
      payload,
    });
  }
}
