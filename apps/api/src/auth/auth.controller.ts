import { Body, Controller, Get, Inject, Post, UseGuards } from '@nestjs/common';

import type {
  ActiveCompanyContext,
  DevelopmentLoginRequest,
  AuthenticatedUser,
  RequestAuthContext,
  SessionResponse,
} from '@einsatzpilot/types';

import { issueAuthToken } from './auth-token';
import { AuthContextService } from './auth-context.service';
import { AuthenticatedGuard } from '../common/authenticated.guard';
import { CompanyContextGuard } from '../common/company-context.guard';
import { CurrentAuthContext } from '../common/current-auth-context.decorator';
import { CurrentCompany } from '../common/current-company.decorator';
import { CurrentUser } from '../common/current-user.decorator';
import { Public } from '../common/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AuthContextService)
    private readonly authContextService: AuthContextService,
  ) {}

  @Public()
  @Get('development-baseline')
  getDevelopmentBaseline() {
    return {
      mode: 'development-login-token',
      loginEndpoint: 'POST /api/auth/development-login',
      tokenTransport: 'Authorization: Bearer <token>',
      fallbackHeadersStillAccepted: true,
      notes: [
        'This is a Phase 1 baseline only and exists to unblock web-first development.',
        'Real email/password login and session issuance still come later.',
      ],
    };
  }

  @Public()
  @Post('development-login')
  async postDevelopmentLogin(@Body() body: DevelopmentLoginRequest) {
    const email = body.email?.trim() || 'office@example.de';
    const displayName = body.displayName?.trim() || 'Buero Test';
    const companySlug = body.companySlug?.trim() || 'luetjens';
    const companyName = body.companyName?.trim() || 'Luetjens Service';
    const membershipRole = body.membershipRole ?? 'OFFICE';

    const identity = await this.authContextService.upsertDevelopmentIdentity({
      email,
      displayName,
      companySlug,
      companyName,
      membershipRole,
    });
    const token = issueAuthToken({
      user: identity.user,
      companySlug: identity.company.slug,
      membershipRole: identity.membershipRole,
    });

    return {
      token,
      session: {
        authenticated: true,
        user: identity.user,
        activeCompany: identity.company,
        membershipRole: identity.membershipRole,
        source: 'access-token',
      },
    };
  }

  @UseGuards(AuthenticatedGuard)
  @Get('session')
  getSession(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentAuthContext() authContext: RequestAuthContext,
  ): SessionResponse {
    if (!authContext.isAuthenticated) {
      throw new Error('Authenticated session expected after AuthenticatedGuard.');
    }

    return {
      authenticated: true,
      user,
      membershipRole: authContext.membershipRole,
      activeCompany: authContext.company,
      source: authContext.source,
    };
  }

  @UseGuards(AuthenticatedGuard)
  @Post('logout')
  postLogout() {
    return {
      cleared: true,
      note: 'Stateless token baseline: the web app should delete its local session token.',
    };
  }

  @UseGuards(AuthenticatedGuard, CompanyContextGuard)
  @Get('company-context')
  getCompanyContext(@CurrentCompany() company: ActiveCompanyContext) {
    return {
      company,
      resolved: true,
    };
  }
}
