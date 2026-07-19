import { Module } from '@nestjs/common';

import { AddressesController } from './addresses.controller';
import { CustomersController } from './customers.controller';
import { DirectoryService } from './directory.service';
import { ObjectsController } from './objects.controller';

@Module({
  providers: [DirectoryService],
  controllers: [CustomersController, AddressesController, ObjectsController],
  exports: [DirectoryService],
})
export class DirectoryModule {}
