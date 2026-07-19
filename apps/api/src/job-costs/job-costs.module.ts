import { Module } from '@nestjs/common';

import { OperationsModule } from '../operations/operations.module';
import { JobCostsController } from './job-costs.controller';
import { JobCostsService } from './job-costs.service';

@Module({
  imports: [OperationsModule],
  controllers: [JobCostsController],
  providers: [JobCostsService],
})
export class JobCostsModule {}
