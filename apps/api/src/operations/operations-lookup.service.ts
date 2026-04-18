import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

const jobDetailInclude = {
  team: {
    include: {
      members: {
        include: {
          user: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  },
  activity: {
    orderBy: {
      createdAt: 'desc',
    },
  },
  reports: {
    include: {
      author: true,
      team: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  },
  attachments: {
    include: {
      job: {
        select: {
          id: true,
          reference: true,
          title: true,
        },
      },
      report: {
        select: {
          id: true,
          summary: true,
        },
      },
      team: true,
      uploader: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  },
} satisfies Prisma.JobInclude;

export type JobDetailRecord = Prisma.JobGetPayload<{
  include: typeof jobDetailInclude;
}>;

@Injectable()
export class OperationsLookupService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async getJobForCompanyOrThrow(companyId: string, jobId: string): Promise<JobDetailRecord> {
    const prisma = this.prisma as PrismaClient;
    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        companyId,
      },
      include: jobDetailInclude,
    });

    if (!job) {
      throw new NotFoundException('Job nicht gefunden.');
    }

    return job;
  }

  async getTeamForCompanyOrThrow(companyId: string, teamId: string) {
    const prisma = this.prisma as PrismaClient;
    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        companyId,
      },
      include: {
        members: {
          include: {
            user: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!team) {
      throw new NotFoundException('Team nicht gefunden.');
    }

    return team;
  }

  async getMembershipForCompanyUserOrThrow(companyId: string, userId: string) {
    const prisma = this.prisma as PrismaClient;
    const membership = await prisma.membership.findFirst({
      where: {
        companyId,
        userId,
        isActive: true,
        user: {
          isActive: true,
        },
      },
      include: {
        user: true,
      },
    });

    if (!membership) {
      throw new NotFoundException('Benutzer gehoert nicht zur aktiven Firma.');
    }

    return membership;
  }
}
