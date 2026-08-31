import { Module } from '@nestjs/common';

import { OperationsModule } from '../operations/operations.module';
import { WorkdaySheetRelationsService } from './workday-sheet-relations.service';
import { WorkdaySheetsController } from './workday-sheets.controller';
import { WorkdaySheetsService } from './workday-sheets.service';

@Module({
  imports: [OperationsModule],
  controllers: [WorkdaySheetsController],
  providers: [WorkdaySheetsService, WorkdaySheetRelationsService],
})
export class WorkdaySheetsModule {}
