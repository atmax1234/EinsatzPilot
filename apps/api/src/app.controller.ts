import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getMeta() {
    return {
      name: 'EinsatzPilot API',
      status: 'foundation',
      message: 'Phase 1 platform foundation is active.',
    };
  }
}
