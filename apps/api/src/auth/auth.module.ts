import { Module } from '@nestjs/common';

import { AuthContextService } from './auth-context.service';
import { AuthController } from './auth.controller';

@Module({
  providers: [AuthContextService],
  controllers: [AuthController],
  exports: [AuthContextService],
})
export class AuthModule {}
