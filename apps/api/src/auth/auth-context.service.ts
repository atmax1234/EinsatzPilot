import { Inject, Injectable } from '@nestjs/common';
import { JobStatus as PrismaJobStatus } from '@prisma/client';
import type { Request } from 'express';

import type {
  ActiveCompanyContext,
  AuthenticatedUser,
  MembershipRole,
  RequestAuthContext,
} from '@einsatzpilot/types';

import { verifyAuthToken } from './auth-token';
import { PrismaService } from '../prisma/prisma.service';

function parseMembershipRole(rawRole: string | undefined): MembershipRole | undefined {
  if (!rawRole) {
    return undefined;
  }

  const normalized = rawRole.toUpperCase() as MembershipRole;
  return normalized === 'OWNER' || normalized === 'OFFICE' || normalized === 'WORKER'
    ? normalized
    : undefined;
}

function mapUser(user: {
  id: string;
  email: string;
  displayName: string | null;
}): AuthenticatedUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName ?? undefined,
  };
}

function mapCompany(company: {
  id: string;
  slug: string;
  name: string;
}): ActiveCompanyContext {
  return {
    id: company.id,
    slug: company.slug,
    name: company.name,
  };
}

@Injectable()
export class AuthContextService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async buildAuthContext(request: Request): Promise<RequestAuthContext> {
    const authorizationHeader = request.header('authorization')?.trim();
    const bearerToken = authorizationHeader?.startsWith('Bearer ')
      ? authorizationHeader.slice('Bearer '.length).trim()
      : undefined;

    if (bearerToken) {
      const tokenContext = await this.buildTokenContext(bearerToken);

      if (tokenContext) {
        return tokenContext;
      }
    }

    return this.buildHeaderContext(request);
  }

  async resolveMembershipContext(input: {
    userId?: string;
    email?: string;
    companySlug?: string;
  }): Promise<
    | {
        user: AuthenticatedUser;
        company?: ActiveCompanyContext;
        membershipRole?: MembershipRole;
      }
    | null
  > {
    const user = input.userId
      ? await this.prisma.user.findUnique({
          where: { id: input.userId },
          include: {
            memberships: {
              where: {
                isActive: true,
                company: {
                  isActive: true,
                  ...(input.companySlug ? { slug: input.companySlug } : {}),
                },
              },
              include: {
                company: true,
              },
              orderBy: {
                createdAt: 'asc',
              },
              take: 1,
            },
          },
        })
      : input.email
        ? await this.prisma.user.findUnique({
            where: { email: input.email },
            include: {
              memberships: {
                where: {
                  isActive: true,
                  company: {
                    isActive: true,
                    ...(input.companySlug ? { slug: input.companySlug } : {}),
                  },
                },
                include: {
                  company: true,
                },
                orderBy: {
                  createdAt: 'asc',
                },
                take: 1,
              },
            },
          })
        : null;

    if (!user || !user.isActive) {
      return null;
    }

    const membership = user.memberships[0];

    return {
      user: mapUser(user),
      company: membership ? mapCompany(membership.company) : undefined,
      membershipRole: membership?.role,
    };
  }

  async upsertDevelopmentIdentity(input: {
    email: string;
    displayName: string;
    companySlug: string;
    companyName: string;
    membershipRole: MembershipRole;
  }) {
    const user = await this.prisma.user.upsert({
      where: {
        email: input.email,
      },
      create: {
        email: input.email,
        displayName: input.displayName,
      },
      update: {
        displayName: input.displayName,
        isActive: true,
      },
    });

    const company = await this.prisma.company.upsert({
      where: {
        slug: input.companySlug,
      },
      create: {
        slug: input.companySlug,
        name: input.companyName,
      },
      update: {
        name: input.companyName,
        isActive: true,
      },
    });

    const membership = await this.prisma.membership.upsert({
      where: {
        userId_companyId: {
          userId: user.id,
          companyId: company.id,
        },
      },
      create: {
        userId: user.id,
        companyId: company.id,
        role: input.membershipRole,
      },
      update: {
        role: input.membershipRole,
        isActive: true,
      },
      include: {
        company: true,
        user: true,
      },
    });

    await this.ensureDevelopmentWorkspace({
      companyId: company.id,
      companySlug: company.slug,
    });

    return {
      user: mapUser(membership.user),
      company: mapCompany(membership.company),
      membershipRole: membership.role,
    };
  }

  private async buildTokenContext(token: string): Promise<RequestAuthContext | null> {
    const payload = verifyAuthToken(token);

    if (!payload) {
      return null;
    }

    const membershipContext = await this.resolveMembershipContext({
      userId: payload.sub,
      email: payload.email,
      companySlug: payload.companySlug,
    });

    if (!membershipContext) {
      return null;
    }

    return {
      isAuthenticated: true,
      source: 'access-token',
      user: membershipContext.user,
      company: membershipContext.company,
      membershipRole: membershipContext.membershipRole,
    };
  }

  private buildHeaderContext(request: Request): RequestAuthContext {
    const email = request.header('x-dev-user-email')?.trim();
    const displayName = request.header('x-dev-user-name')?.trim();
    const userId = request.header('x-dev-user-id')?.trim();
    const companySlug = request.header('x-company-slug')?.trim();
    const companyId = request.header('x-company-id')?.trim();
    const companyName = request.header('x-company-name')?.trim();
    const membershipRole = parseMembershipRole(request.header('x-membership-role')?.trim());

    if (!email) {
      return {
        isAuthenticated: false,
        source: 'anonymous',
      };
    }

    return {
      isAuthenticated: true,
      source: 'dev-headers',
      user: {
        id: userId ?? `dev:${email}`,
        email,
        displayName: displayName || undefined,
      },
      company: companySlug
        ? {
            id: companyId ?? `company:${companySlug}`,
            slug: companySlug,
            name: companyName ?? companySlug,
          }
        : undefined,
      membershipRole,
    };
  }

  private async ensureDevelopmentWorkspace(input: {
    companyId: string;
    companySlug: string;
  }) {
    const existingJobs = await this.prisma.job.count({
      where: {
        companyId: input.companyId,
      },
    });

    if (existingJobs > 0) {
      return;
    }

    const seedUsers = [
      {
        email: `${input.companySlug}.lead.alpha@example.de`,
        displayName: 'Jessica Vance',
      },
      {
        email: `${input.companySlug}.tech.alpha@example.de`,
        displayName: 'Robert Chen',
      },
      {
        email: `${input.companySlug}.lead.beta@example.de`,
        displayName: 'Lukas Schmidt',
      },
      {
        email: `${input.companySlug}.tech.beta@example.de`,
        displayName: 'Sarah Meyer',
      },
    ];

    const createdUsers = await Promise.all(
      seedUsers.map((user) =>
        this.prisma.user.upsert({
          where: {
            email: user.email,
          },
          create: {
            email: user.email,
            displayName: user.displayName,
          },
          update: {
            displayName: user.displayName,
            isActive: true,
          },
        }),
      ),
    );

    await Promise.all(
      createdUsers.map((user) =>
        this.prisma.membership.upsert({
          where: {
            userId_companyId: {
              userId: user.id,
              companyId: input.companyId,
            },
          },
          create: {
            userId: user.id,
            companyId: input.companyId,
            role: 'WORKER',
          },
          update: {
            role: 'WORKER',
            isActive: true,
          },
        }),
      ),
    );

    const alphaTeam = await this.prisma.team.create({
      data: {
        companyId: input.companyId,
        name: 'Team Alpha',
        code: 'ALPHA',
        specialty: 'Wartung',
        status: 'ACTIVE',
        currentAssignment: 'HVAC-Systemwartung',
      },
    });

    const betaTeam = await this.prisma.team.create({
      data: {
        companyId: input.companyId,
        name: 'Team Beta',
        code: 'BETA',
        specialty: 'Stoerungen',
        status: 'ACTIVE',
        currentAssignment: 'Lecksuche und Nachkontrolle',
      },
    });

    await this.prisma.teamMember.createMany({
      data: [
        {
          teamId: alphaTeam.id,
          userId: createdUsers[0].id,
          roleLabel: 'Teamleitung',
        },
        {
          teamId: alphaTeam.id,
          userId: createdUsers[1].id,
          roleLabel: 'Technik',
        },
        {
          teamId: betaTeam.id,
          userId: createdUsers[2].id,
          roleLabel: 'Teamleitung',
        },
        {
          teamId: betaTeam.id,
          userId: createdUsers[3].id,
          roleLabel: 'Assistenz',
        },
      ],
    });

    const jobs = await Promise.all([
      this.prisma.job.create({
        data: {
          companyId: input.companyId,
          teamId: alphaTeam.id,
          reference: `${input.companySlug.toUpperCase()}-1001`,
          title: 'HVAC-Systemwartung',
          description: 'Geplante Wartung fuer die Anlage im Nordfluegel inklusive Sichtpruefung und Filtertausch.',
          customerName: 'Miller Residence',
          location: '124 Maple Avenue, Muenchen',
          scheduledStart: new Date('2026-03-21T08:30:00.000Z'),
          scheduledEnd: new Date('2026-03-21T10:30:00.000Z'),
          status: 'IN_PROGRESS',
          priority: 'HIGH',
        },
      }),
      this.prisma.job.create({
        data: {
          companyId: input.companyId,
          teamId: betaTeam.id,
          reference: `${input.companySlug.toUpperCase()}-1002`,
          title: 'Wasserleck beheben',
          description: 'Akute Stoerung im Kellerbereich mit Dokumentation fuer den Hausverwalter.',
          customerName: 'Grand Hotel',
          location: 'Suite 405, Dortmund',
          scheduledStart: new Date('2026-03-21T11:00:00.000Z'),
          scheduledEnd: new Date('2026-03-21T13:00:00.000Z'),
          status: PrismaJobStatus.PLANNED,
          priority: 'URGENT',
        },
      }),
      this.prisma.job.create({
        data: {
          companyId: input.companyId,
          teamId: alphaTeam.id,
          reference: `${input.companySlug.toUpperCase()}-1003`,
          title: 'Elektrik nachpruefen',
          description: 'Nachkontrolle der Unterverteilung nach gestrigem Stoerungseinsatz.',
          customerName: 'Smith & Co',
          location: 'Industriepark 4, Essen',
          scheduledStart: new Date('2026-03-20T13:30:00.000Z'),
          scheduledEnd: new Date('2026-03-20T15:00:00.000Z'),
          status: 'DONE',
          priority: 'NORMAL',
        },
      }),
    ]);

    await this.prisma.jobActivity.createMany({
      data: [
        {
          jobId: jobs[0].id,
          kind: 'STATUS',
          title: 'Status auf In Bearbeitung gesetzt',
          content: 'Team Alpha hat den Auftrag vor Ort gestartet.',
          authorName: 'Jessica Vance',
          createdAt: new Date('2026-03-21T08:35:00.000Z'),
        },
        {
          jobId: jobs[0].id,
          kind: 'NOTE',
          title: 'Techniknotiz',
          content: 'Filter stark verschmutzt. Austausch empfohlen und bereits vorbereitet.',
          authorName: 'Robert Chen',
          createdAt: new Date('2026-03-21T09:10:00.000Z'),
        },
        {
          jobId: jobs[1].id,
          kind: 'REPORT',
          title: 'Einsatz vorbereitet',
          content: 'Materialpruefung abgeschlossen. Team Beta startet wie geplant um 11:00 Uhr.',
          authorName: 'Lukas Schmidt',
          createdAt: new Date('2026-03-21T10:15:00.000Z'),
        },
        {
          jobId: jobs[2].id,
          kind: 'STATUS',
          title: 'Auftrag abgeschlossen',
          content: 'Elektrik geprueft und Anlage wieder freigegeben.',
          authorName: 'Jessica Vance',
          createdAt: new Date('2026-03-20T15:05:00.000Z'),
        },
      ],
    });
  }
}
