import { Controller, Get, Header, Inject, Param, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';

import type {
  ActiveCompanyContext,
  PhotoLibraryResponse,
  RequestAuthContext,
} from '@einsatzpilot/types';

import { AuthenticatedGuard } from '../common/authenticated.guard';
import { CompanyContextGuard } from '../common/company-context.guard';
import { CurrentAuthContext } from '../common/current-auth-context.decorator';
import { CurrentCompany } from '../common/current-company.decorator';
import { AttachmentsService } from './attachments.service';

@Controller('attachments')
@UseGuards(AuthenticatedGuard, CompanyContextGuard)
export class AttachmentsController {
  constructor(
    @Inject(AttachmentsService)
    private readonly attachmentsService: AttachmentsService,
  ) {}

  @Get('photos')
  listPhotoLibrary(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentAuthContext() authContext: RequestAuthContext,
  ): Promise<PhotoLibraryResponse> {
    return this.attachmentsService.listPhotoLibrary(company.id, authContext);
  }

  @Get(':attachmentId')
  getAttachmentMetadata(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentAuthContext() authContext: RequestAuthContext,
    @Param('attachmentId') attachmentId: string,
  ) {
    return this.attachmentsService.getAttachmentMetadata(company.id, attachmentId, authContext);
  }

  @Get(':attachmentId/file')
  @Header('Cache-Control', 'private, max-age=60')
  async getAttachmentFile(
    @CurrentCompany() company: ActiveCompanyContext,
    @CurrentAuthContext() authContext: RequestAuthContext,
    @Param('attachmentId') attachmentId: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.attachmentsService.getAttachmentFile(
      company.id,
      attachmentId,
      authContext,
    );

    response.setHeader('Content-Type', result.mimeType);
    response.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(result.fileName)}"`,
    );

    return result.file;
  }
}
