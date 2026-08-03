import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { CustomerReportSourceService } from './customer-report-source.service';
import { CustomerReportsController } from './customer-reports.controller';
import { CustomerReportsService } from './customer-reports.service';
import { JobCustomerReportSourceController } from './job-customer-report-source.controller';

@Module({
  imports: [PrismaModule],
  controllers: [CustomerReportsController, JobCustomerReportSourceController],
  providers: [CustomerReportsService, CustomerReportSourceService],
})
export class CustomerReportsModule {}
