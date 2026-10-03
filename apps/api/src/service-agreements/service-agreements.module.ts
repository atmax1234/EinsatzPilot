import { Module } from '@nestjs/common';

import { OperationsModule } from '../operations/operations.module';
import { ServiceAgreementRelationsService } from './service-agreement-relations.service';
import { ServiceAgreementsController } from './service-agreements.controller';
import { ServiceAgreementsService } from './service-agreements.service';

@Module({
  imports: [OperationsModule],
  controllers: [ServiceAgreementsController],
  providers: [ServiceAgreementsService, ServiceAgreementRelationsService],
})
export class ServiceAgreementsModule {}
