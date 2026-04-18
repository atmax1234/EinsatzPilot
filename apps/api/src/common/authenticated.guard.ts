import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class AuthenticatedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authContext = request.authContext;

    if (!authContext?.isAuthenticated) {
      throw new UnauthorizedException(
        'Authentication required. Use the development login token or the temporary development headers baseline.',
      );
    }

    return true;
  }
}
