import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import type {
  ActiveCompanyContext,
  AuthenticatedUser,
  JobAttachmentListResponse,
  RequestAuthContext,
} from '@einsatzpilot/types';

import { AuthenticatedGuard } from '../common/authenticated.guard';
import { CompanyContextGuard } from '../common/company-context.guard';
import { CurrentAuthContext } from '../common/current-auth-context.decorator';
import { CurrentCompany } from '../common/current-company.decorator';
import { CurrentUser } from '../common/current-user.decorator';
import { AttachmentsService } from './attachments.service';

type UploadedFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

@Controller('jobs/:jobId/attachments')
@UseGuards(AuthenticatedGuard, CompanyContextGuard)
export class JobAttachmentsController {
  constructor(
    @Inject(AttachmentsService)
    private readonly attachmentsService: AttachmentsService,
  ) {}

  @Get()
  listJobAttachments(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentAuthContext() authContext: RequestAuthContext,
    @Param('jobId') jobId: string,
  ): Promise<JobAttachmentListResponse> {
    return this.attachmentsService.listJobAttachments(company.id, jobId, authContext);
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  uploadJobAttachment(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentUser() user: AuthenticatedUser,
    @CurrentAuthContext() authContext: RequestAuthContext,
    @Param('jobId') jobId: string,
    @UploadedFile() file: UploadedFile | undefined,
    @Body() payload: Record<string, unknown>,
  ): Promise<JobAttachmentListResponse> {
    return this.attachmentsService.uploadJobAttachment({
      companyId: company.id,
      jobId,
      actor: user,
      authContext,
      payload,
      file,
    });
  }
}
