import type { RequestAuthContext } from '../common/request-context';

declare global {
  namespace Express {
    interface Request {
      authContext?: RequestAuthContext;
    }
  }
}

export {};
