import { Controller, Get } from '@nestjs/common';

@Controller('foundation')
export class FoundationController {
  @Get()
  getFoundationSummary() {
    return {
      tenantModel: ['Company', 'User', 'Membership'],
      priority: ['auth', 'tenant-context', 'shared-contracts'],
      featureWorkStarted: false,
    };
  }
}
