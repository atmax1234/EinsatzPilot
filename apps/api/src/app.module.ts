import { Module } from '@nestjs/common';

import { AttachmentsModule } from './attachments/attachments.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { CustomerReportsModule } from './customer-reports/customer-reports.module';
import { DirectoryModule } from './directory/directory.module';
import { FoundationModule } from './foundation/foundation.module';
import { HealthModule } from './health/health.module';
import { ItemsModule } from './items/items.module';
import { JobCostsModule } from './job-costs/job-costs.module';
import { OperationsModule } from './operations/operations.module';
import { PrismaModule } from './prisma/prisma.module';
import { ReportsModule } from './reports/reports.module';
import { WorkdaySheetsModule } from './workday-sheets/workday-sheets.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    CustomerReportsModule,
    FoundationModule,
    HealthModule,
    OperationsModule,
    DirectoryModule,
    ItemsModule,
    JobCostsModule,
    ReportsModule,
    AttachmentsModule,
    AssignmentsModule,
    WorkdaySheetsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
