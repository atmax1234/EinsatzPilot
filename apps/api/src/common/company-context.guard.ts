import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class CompanyContextGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authContext = request.authContext;

    if (!authContext?.isAuthenticated) {
      return false;
    }

    if (!authContext.company?.slug) {
      throw new BadRequestException(
        'Active company context required. Resolve a valid membership for the current request.',
      );
    }

    return true;
  }
}
