import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import type {
  ActiveCompanyContext,
  AuthenticatedUser,
  RecurringObjectDutyCreateInput,
  RecurringObjectDutyUpdateInput,
  RequestAuthContext,
  ServiceAgreementCreateInput,
  ServiceAgreementDetailResponse,
  ServiceAgreementListFilters,
  ServiceAgreementListResponse,
  ServiceAgreementOptionsResponse,
  ServiceAgreementStatusUpdateInput,
  ServiceAgreementUpdateInput,
} from '@einsatzpilot/types';

import { AuthenticatedGuard } from '../common/authenticated.guard';
import { CompanyContextGuard } from '../common/company-context.guard';
import { CurrentAuthContext } from '../common/current-auth-context.decorator';
import { CurrentCompany } from '../common/current-company.decorator';
import { CurrentUser } from '../common/current-user.decorator';
import { ServiceAgreementsService } from './service-agreements.service';

@Controller('service-agreements')
@UseGuards(AuthenticatedGuard, CompanyContextGuard)
export class ServiceAgreementsController {
  constructor(
    @Inject(ServiceAgreementsService)
    private readonly serviceAgreementsService: ServiceAgreementsService,
  ) {}

  @Get()
  list(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentAuthContext() authContext: RequestAuthContext,
    @Query() filters: ServiceAgreementListFilters,
  ): Promise<ServiceAgreementListResponse> {
    return this.serviceAgreementsService.getServiceAgreements({
      companyId: company.id,
      authContext,
      filters,
    });
  }

  @Get('options')
  options(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentAuthContext() authContext: RequestAuthContext,
  ): Promise<ServiceAgreementOptionsResponse> {
    return this.serviceAgreementsService.getOptions({ companyId: company.id, authContext });
  }

  @Post()
  create(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentUser() actor: AuthenticatedUser,
    @CurrentAuthContext() authContext: RequestAuthContext,
    @Body() payload: ServiceAgreementCreateInput,
  ): Promise<ServiceAgreementDetailResponse> {
    return this.serviceAgreementsService.createServiceAgreement({
      companyId: company.id,
      actor,
      authContext,
      payload,
    });
  }

  @Get(':agreementId')
  detail(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentAuthContext() authContext: RequestAuthContext,
    @Param('agreementId') agreementId: string,
  ): Promise<ServiceAgreementDetailResponse> {
    return this.serviceAgreementsService.getServiceAgreementDetail({
      companyId: company.id,
      agreementId,
      authContext,
    });
  }

  @Patch(':agreementId')
  update(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentUser() actor: AuthenticatedUser,
    @CurrentAuthContext() authContext: RequestAuthContext,
    @Param('agreementId') agreementId: string,
    @Body() payload: ServiceAgreementUpdateInput,
  ): Promise<ServiceAgreementDetailResponse> {
    return this.serviceAgreementsService.updateServiceAgreement({
      companyId: company.id,
      agreementId,
      actor,
      authContext,
      payload,
    });
  }

  @Patch(':agreementId/status')
  transitionStatus(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentUser() actor: AuthenticatedUser,
    @CurrentAuthContext() authContext: RequestAuthContext,
    @Param('agreementId') agreementId: string,
    @Body() payload: ServiceAgreementStatusUpdateInput,
  ): Promise<ServiceAgreementDetailResponse> {
    return this.serviceAgreementsService.transitionStatus({
      companyId: company.id,
      agreementId,
      actor,
      authContext,
      payload,
    });
  }

  @Post(':agreementId/duties')
  addDuty(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentUser() actor: AuthenticatedUser,
    @CurrentAuthContext() authContext: RequestAuthContext,
    @Param('agreementId') agreementId: string,
    @Body() payload: RecurringObjectDutyCreateInput,
  ): Promise<ServiceAgreementDetailResponse> {
    return this.serviceAgreementsService.addDuty({
      companyId: company.id,
      agreementId,
      actor,
      authContext,
      payload,
    });
  }

  @Patch(':agreementId/duties/:dutyId')
  updateDuty(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentUser() actor: AuthenticatedUser,
    @CurrentAuthContext() authContext: RequestAuthContext,
    @Param('agreementId') agreementId: string,
    @Param('dutyId') dutyId: string,
    @Body() payload: RecurringObjectDutyUpdateInput,
  ): Promise<ServiceAgreementDetailResponse> {
    return this.serviceAgreementsService.updateDuty({
      companyId: company.id,
      agreementId,
      dutyId,
      actor,
      authContext,
      payload,
    });
  }
}
