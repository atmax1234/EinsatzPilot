import { Module } from '@nestjs/common';

import { CompanyMembersController } from './company-members.controller';
import { DashboardController } from './dashboard.controller';
import { JobAccessService } from './job-access.service';
import { JobsController } from './jobs.controller';
import { OperationsLookupService } from './operations-lookup.service';
import { OperationsService } from './operations.service';
import { OperationsWriteService } from './operations-write.service';
import { TeamsController } from './teams.controller';

@Module({
  providers: [
    JobAccessService,
    OperationsService,
    OperationsLookupService,
    OperationsWriteService,
  ],
  controllers: [CompanyMembersController, DashboardController, JobsController, TeamsController],
  exports: [
    JobAccessService,
    OperationsService,
    OperationsLookupService,
    OperationsWriteService,
  ],
})
export class OperationsModule {}
