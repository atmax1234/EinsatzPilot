import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, UseGuards } from '@nestjs/common';

import type {
  ActiveCompanyContext,
  RequestAuthContext,
  TeamCreateInput,
  TeamListItem,
  TeamListResponse,
  TeamMemberAddInput,
  TeamMemberRemoveInput,
  TeamUpdateInput,
} from '@einsatzpilot/types';

import { AuthenticatedGuard } from '../common/authenticated.guard';
import { CompanyContextGuard } from '../common/company-context.guard';
import { CurrentAuthContext } from '../common/current-auth-context.decorator';
import { CurrentCompany } from '../common/current-company.decorator';
import { OperationsService } from './operations.service';
import { OperationsWriteService } from './operations-write.service';

@Controller('teams')
@UseGuards(AuthenticatedGuard, CompanyContextGuard)
export class TeamsController {
  constructor(
    @Inject(OperationsService)
    private readonly operationsService: OperationsService,
    @Inject(OperationsWriteService)
    private readonly operationsWriteService: OperationsWriteService,
  ) {}

  @Get()
  getTeams(@CurrentCompany() company: ActiveCompanyContext): Promise<TeamListResponse> {
    return this.operationsService.getTeams(company.id);
  }

  @Post()
  createTeam(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentAuthContext() authContext: RequestAuthContext,
    @Body() payload: TeamCreateInput,
  ): Promise<TeamListItem> {
    return this.operationsWriteService.createTeam({
      companyId: company.id,
      authContext,
      payload,
    });
  }

  @Patch(':teamId')
  updateTeam(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentAuthContext() authContext: RequestAuthContext,
    @Param('teamId') teamId: string,
    @Body() payload: TeamUpdateInput,
  ): Promise<TeamListItem> {
    return this.operationsWriteService.updateTeam({
      companyId: company.id,
      teamId,
      authContext,
      payload,
    });
  }

  @Post(':teamId/members')
  addTeamMember(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentAuthContext() authContext: RequestAuthContext,
    @Param('teamId') teamId: string,
    @Body() payload: TeamMemberAddInput,
  ): Promise<TeamListItem> {
    return this.operationsWriteService.addTeamMember({
      companyId: company.id,
      teamId,
      authContext,
      payload,
    });
  }

  @Delete(':teamId/members/:userId')
  removeTeamMember(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentAuthContext() authContext: RequestAuthContext,
    @Param('teamId') teamId: string,
    @Param('userId') userId: string,
  ): Promise<TeamListItem> {
    return this.operationsWriteService.removeTeamMember({
      companyId: company.id,
      teamId,
      authContext,
      payload: {
        userId,
      } satisfies TeamMemberRemoveInput,
    });
  }
}
