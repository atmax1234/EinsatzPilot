import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

import type {
  AttachmentKind,
  AuthenticatedUser,
  JobAttachmentListResponse,
  PhotoLibraryResponse,
  RequestAuthContext,
} from '@einsatzpilot/types';

import { PrismaService } from '../prisma/prisma.service';
import { OperationsLookupService } from '../operations/operations-lookup.service';
import {
  assertCanReadCompanyArtifacts,
  assertCanUploadJobAttachments,
} from '../operations/operations-permissions';
import { mapJobAttachmentItem } from '../reports/reports-mapper';
import { LocalFileStorageService } from './local-file-storage.service';
import {
  normalizeAttachmentKind,
  normalizeAttachmentUploadInput,
} from './attachments-payloads';

type UploadedFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

@Injectable()
export class AttachmentsService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(OperationsLookupService)
    private readonly operationsLookupService: OperationsLookupService,
    @Inject(LocalFileStorageService)
    private readonly localFileStorageService: LocalFileStorageService,
  ) {}

  async listJobAttachments(
    companyId: string,
    jobId: string,
    authContext: RequestAuthContext,
  ): Promise<JobAttachmentListResponse> {
    assertCanReadCompanyArtifacts(authContext);
    await this.operationsLookupService.getJobForCompanyOrThrow(companyId, jobId);
    const prisma = this.prisma as PrismaClient;

    const attachments = await prisma.jobAttachment.findMany({
      where: {
        companyId,
        jobId,
      },
      include: {
        job: {
          select: {
            id: true,
            reference: true,
            title: true,
          },
        },
        report: {
          select: {
            id: true,
            summary: true,
          },
        },
        team: true,
        uploader: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      attachments: attachments.map((attachment) => mapJobAttachmentItem(attachment)),
    };
  }

  async uploadJobAttachment(input: {
    companyId: string;
    jobId: string;
    actor: AuthenticatedUser;
    authContext: RequestAuthContext;
    payload: {
      caption?: unknown;
      reportId?: unknown;
      teamId?: unknown;
      kind?: unknown;
    };
    file?: UploadedFile;
  }): Promise<JobAttachmentListResponse> {
    assertCanUploadJobAttachments(input.authContext);

    if (!input.file) {
      throw new BadRequestException('Datei ist erforderlich.');
    }

    const normalizedPayload = normalizeAttachmentUploadInput(input.payload);
    const job = await this.operationsLookupService.getJobForCompanyOrThrow(input.companyId, input.jobId);
    const prisma = this.prisma as PrismaClient;

    const team =
      normalizedPayload.teamId === undefined
        ? job.team
        : normalizedPayload.teamId
          ? await this.operationsLookupService.getTeamForCompanyOrThrow(
              input.companyId,
              normalizedPayload.teamId,
            )
          : null;

    const report = normalizedPayload.reportId
      ? await prisma.jobReport.findFirst({
          where: {
            id: normalizedPayload.reportId,
            companyId: input.companyId,
            jobId: job.id,
          },
          select: {
            id: true,
            summary: true,
          },
        })
      : null;

    if (normalizedPayload.reportId && !report) {
      throw new NotFoundException('Bericht fuer diesen Auftrag nicht gefunden.');
    }

    const kind = normalizeAttachmentKind(normalizedPayload.kind, input.file.mimetype);
    const storedFile = await this.localFileStorageService.saveFile({
      companyId: input.companyId,
      jobId: job.id,
      originalName: input.file.originalname,
      buffer: input.file.buffer,
    });

    await prisma.jobAttachment.create({
      data: {
        companyId: input.companyId,
        jobId: job.id,
        reportId: report?.id,
        teamId: team?.id,
        uploaderUserId: input.actor.id,
        kind,
        storagePath: storedFile.storagePath,
        fileName: input.file.originalname,
        mimeType: input.file.mimetype || 'application/octet-stream',
        sizeBytes: input.file.size,
        caption: normalizedPayload.caption,
      },
    });

    return this.listJobAttachments(input.companyId, input.jobId, input.authContext);
  }

  async listPhotoLibrary(
    companyId: string,
    authContext: RequestAuthContext,
  ): Promise<PhotoLibraryResponse> {
    assertCanReadCompanyArtifacts(authContext);
    const prisma = this.prisma as PrismaClient;

    const attachments = await prisma.jobAttachment.findMany({
      where: {
        companyId,
        kind: 'PHOTO',
      },
      include: {
        job: {
          select: {
            id: true,
            reference: true,
            title: true,
          },
        },
        report: {
          select: {
            id: true,
            summary: true,
          },
        },
        team: true,
        uploader: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      attachments: attachments.map((attachment) => mapJobAttachmentItem(attachment)),
    };
  }

  async getAttachmentMetadata(
    companyId: string,
    attachmentId: string,
    authContext: RequestAuthContext,
  ) {
    assertCanReadCompanyArtifacts(authContext);
    const prisma = this.prisma as PrismaClient;

    const attachment = await prisma.jobAttachment.findFirst({
      where: {
        id: attachmentId,
        companyId,
      },
      include: {
        job: {
          select: {
            id: true,
            reference: true,
            title: true,
          },
        },
        report: {
          select: {
            id: true,
            summary: true,
          },
        },
        team: true,
        uploader: true,
      },
    });

    if (!attachment) {
      throw new NotFoundException('Datei nicht gefunden.');
    }

    return {
      attachment: mapJobAttachmentItem(attachment),
    };
  }

  async getAttachmentFile(
    companyId: string,
    attachmentId: string,
    authContext: RequestAuthContext,
  ) {
    const metadata = await this.getAttachmentRecord(companyId, attachmentId, authContext);
    const file = await this.localFileStorageService.readFile(metadata.storagePath);

    return {
      mimeType: metadata.mimeType,
      fileName: metadata.fileName,
      file: new StreamableFile(file.fileBuffer),
    };
  }

  private async getAttachmentRecord(
    companyId: string,
    attachmentId: string,
    authContext: RequestAuthContext,
  ) {
    assertCanReadCompanyArtifacts(authContext);
    const prisma = this.prisma as PrismaClient;

    const attachment = await prisma.jobAttachment.findFirst({
      where: {
        id: attachmentId,
        companyId,
      },
      select: {
        id: true,
        fileName: true,
        mimeType: true,
        storagePath: true,
      },
    });

    if (!attachment) {
      throw new NotFoundException('Datei nicht gefunden.');
    }

    return attachment;
  }
}
