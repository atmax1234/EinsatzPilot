import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

import type { RequestAuthContext } from './request-context';

export const CurrentAuthContext = createParamDecorator(
  (_data: unknown, context: ExecutionContext): RequestAuthContext | undefined => {
    const request = context.switchToHttp().getRequest();
    return request.authContext;
  },
);
