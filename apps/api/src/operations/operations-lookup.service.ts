import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

import type { JobRelationOptionsResponse } from '@einsatzpilot/types';

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
  customer: true,
  address: true,
  object: true,
  objectArea: true,
  activity: {
    orderBy: {
      createdAt: 'desc',
    },
  },
  reports: {
    include: {
      author: true,
      team: true,
      reviewer: true,
      attachments: {
        orderBy: {
          createdAt: 'desc',
        },
      },
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

  async getCustomerForCompanyOrThrow(companyId: string, customerId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, companyId },
      select: { id: true, name: true },
    });

    if (!customer) {
      throw new NotFoundException('Kunde wurde in der aktiven Firma nicht gefunden.');
    }

    return customer;
  }

  async getAddressForCompanyOrThrow(companyId: string, addressId: string) {
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, companyId },
      select: {
        id: true,
        label: true,
        street: true,
        postalCode: true,
        city: true,
        country: true,
      },
    });

    if (!address) {
      throw new NotFoundException('Adresse wurde in der aktiven Firma nicht gefunden.');
    }

    return address;
  }

  async getObjectForCompanyOrThrow(companyId: string, objectId: string) {
    const object = await this.prisma.object.findFirst({
      where: { id: objectId, companyId },
      select: { id: true, name: true },
    });

    if (!object) {
      throw new NotFoundException('Objekt wurde in der aktiven Firma nicht gefunden.');
    }

    return object;
  }

  async getObjectAreaForCompanyOrThrow(companyId: string, objectAreaId: string) {
    const objectArea = await this.prisma.objectArea.findFirst({
      where: { id: objectAreaId, companyId },
      select: { id: true, objectId: true, name: true },
    });

    if (!objectArea) {
      throw new NotFoundException('Objektbereich wurde in der aktiven Firma nicht gefunden.');
    }

    return objectArea;
  }

  async getJobRelationOptions(companyId: string): Promise<JobRelationOptionsResponse> {
    const [customers, addresses, objects, objectAreas] = await Promise.all([
      this.prisma.customer.findMany({
        where: { companyId },
        select: { id: true, name: true },
        orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
      }),
      this.prisma.address.findMany({
        where: { companyId },
        select: {
          id: true,
          label: true,
          street: true,
          postalCode: true,
          city: true,
          country: true,
        },
        orderBy: [{ label: 'asc' }, { city: 'asc' }, { street: 'asc' }],
      }),
      this.prisma.object.findMany({
        where: { companyId },
        select: { id: true, name: true },
        orderBy: [{ status: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.objectArea.findMany({
        where: { companyId },
        select: { id: true, objectId: true, name: true },
        orderBy: [{ objectId: 'asc' }, { name: 'asc' }],
      }),
    ]);

    return { customers, addresses, objects, objectAreas };
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
