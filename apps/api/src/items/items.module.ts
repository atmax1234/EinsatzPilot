import { Module } from '@nestjs/common';

import { ItemCategoriesController } from './item-categories.controller';
import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';

@Module({
  providers: [ItemsService],
  controllers: [ItemCategoriesController, ItemsController],
})
export class ItemsModule {}
