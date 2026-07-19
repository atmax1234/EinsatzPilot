import { Body, Controller, Get, Inject, Param, Patch, Post, UseGuards } from '@nestjs/common';

import type {
  ActiveCompanyContext,
  AssignmentCreateInput,
  AssignmentDetailResponse,
  AssignmentEntityOptionsResponse,
  AssignmentListItem,
  AssignmentListResponse,
  AssignmentUpdateInput,
  AuthenticatedUser,
  RequestAuthContext,
} from '@einsatzpilot/types';

import { AuthenticatedGuard } from '../common/authenticated.guard';
import { CompanyContextGuard } from '../common/company-context.guard';
import { CurrentAuthContext } from '../common/current-auth-context.decorator';
import { CurrentCompany } from '../common/current-company.decorator';
import { CurrentUser } from '../common/current-user.decorator';
import { AssignmentsService } from './assignments.service';

@Controller('assignments')
@UseGuards(AuthenticatedGuard, CompanyContextGuard)
export class AssignmentsController {
  constructor(
    @Inject(AssignmentsService)
    private readonly assignmentsService: AssignmentsService,
  ) {}

  @Get()
  getAssignments(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentAuthContext() authContext: RequestAuthContext,
  ): Promise<AssignmentListResponse> {
    return this.assignmentsService.getAssignments({ companyId: company.id, authContext });
  }

  @Get('options')
  getEntityOptions(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentAuthContext() authContext: RequestAuthContext,
  ): Promise<AssignmentEntityOptionsResponse> {
    return this.assignmentsService.getEntityOptions({ companyId: company.id, authContext });
  }

  @Post()
  createAssignment(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentUser() actor: AuthenticatedUser,
    @CurrentAuthContext() authContext: RequestAuthContext,
    @Body() payload: AssignmentCreateInput,
  ): Promise<AssignmentListItem> {
    return this.assignmentsService.createAssignment({
      companyId: company.id,
      actor,
      authContext,
      payload,
    });
  }

  @Get(':assignmentId')
  getAssignmentDetail(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentAuthContext() authContext: RequestAuthContext,
    @Param('assignmentId') assignmentId: string,
  ): Promise<AssignmentDetailResponse> {
    return this.assignmentsService.getAssignmentDetail({
      companyId: company.id,
      assignmentId,
      authContext,
    });
  }

  @Patch(':assignmentId')
  updateAssignment(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentAuthContext() authContext: RequestAuthContext,
    @Param('assignmentId') assignmentId: string,
    @Body() payload: AssignmentUpdateInput,
  ): Promise<AssignmentListItem> {
    return this.assignmentsService.updateAssignment({
      companyId: company.id,
      assignmentId,
      authContext,
      payload,
    });
  }
}
