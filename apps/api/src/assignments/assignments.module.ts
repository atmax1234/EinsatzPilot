import { Module } from '@nestjs/common';

import { AssignmentEntityResolverService } from './assignment-entity-resolver.service';
import { AssignmentsController } from './assignments.controller';
import { AssignmentsService } from './assignments.service';

@Module({
  providers: [AssignmentsService, AssignmentEntityResolverService],
  controllers: [AssignmentsController],
})
export class AssignmentsModule {}
