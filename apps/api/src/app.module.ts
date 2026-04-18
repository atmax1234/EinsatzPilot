import { Module } from '@nestjs/common';

import { AttachmentsModule } from './attachments/attachments.module';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { FoundationModule } from './foundation/foundation.module';
import { HealthModule } from './health/health.module';
import { OperationsModule } from './operations/operations.module';
import { PrismaModule } from './prisma/prisma.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    FoundationModule,
    HealthModule,
    OperationsModule,
    ReportsModule,
    AttachmentsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
