import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

import type { ActiveCompanyContext } from './request-context';

export const CurrentCompany = createParamDecorator(
  (_data: unknown, context: ExecutionContext): ActiveCompanyContext | undefined => {
    const request = context.switchToHttp().getRequest();
    return request.authContext?.isAuthenticated ? request.authContext.company : undefined;
  },
);
