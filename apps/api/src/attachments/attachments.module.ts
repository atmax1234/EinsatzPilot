import { Module } from '@nestjs/common';

import { OperationsModule } from '../operations/operations.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AttachmentsController } from './attachments.controller';
import { AttachmentsService } from './attachments.service';
import { JobAttachmentsController } from './job-attachments.controller';
import { LocalFileStorageService } from './local-file-storage.service';

@Module({
  imports: [PrismaModule, OperationsModule],
  controllers: [AttachmentsController, JobAttachmentsController],
  providers: [AttachmentsService, LocalFileStorageService],
  exports: [AttachmentsService],
})
export class AttachmentsModule {}
