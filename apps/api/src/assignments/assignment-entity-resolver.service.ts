import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import type {
  AssignmentEntityOption,
  AssignmentEntityOptionsResponse,
  AssignmentEntityType,
} from '@einsatzpilot/types';

import { PrismaService } from '../prisma/prisma.service';

type EntityRole = 'source' | 'target';

function entityKey(type: AssignmentEntityType, id: string) {
  return `${type}:${id}`;
}

function sortOptions(options: AssignmentEntityOption[]) {
  return options.sort((left, right) => left.label.localeCompare(right.label, 'de'));
}

@Injectable()
export class AssignmentEntityResolverService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async getEntityOptions(companyId: string): Promise<AssignmentEntityOptionsResponse> {
    const [memberships, teams, jobs, customers, addresses, objects, objectAreas, items] =
      await Promise.all([
        this.prisma.membership.findMany({
          where: { companyId, isActive: true, user: { isActive: true } },
          include: { user: true },
        }),
        this.prisma.team.findMany({ where: { companyId } }),
        this.prisma.job.findMany({ where: { companyId } }),
        this.prisma.customer.findMany({ where: { companyId } }),
        this.prisma.address.findMany({ where: { companyId } }),
        this.prisma.object.findMany({ where: { companyId } }),
        this.prisma.objectArea.findMany({
          where: { companyId },
          include: { object: { select: { name: true } } },
        }),
        this.prisma.item.findMany({ where: { companyId } }),
      ]);

    return {
      entities: {
        USER: sortOptions(
          memberships.map(({ user, role }) => ({
            type: 'USER' as const,
            id: user.id,
            label: user.displayName ?? user.email,
            detail: `${user.email} · ${role}`,
          })),
        ),
        TEAM: sortOptions(
          teams.map((team) => ({
            type: 'TEAM' as const,
            id: team.id,
            label: team.name,
            detail: team.code ?? team.specialty ?? undefined,
          })),
        ),
        JOB: sortOptions(
          jobs.map((job) => ({
            type: 'JOB' as const,
            id: job.id,
            label: job.title,
            detail: job.reference,
          })),
        ),
        CUSTOMER: sortOptions(
          customers.map((customer) => ({
            type: 'CUSTOMER' as const,
            id: customer.id,
            label: customer.name,
            detail: customer.type,
          })),
        ),
        ADDRESS: sortOptions(
          addresses.map((address) => ({
            type: 'ADDRESS' as const,
            id: address.id,
            label: address.label,
            detail: `${address.street}, ${address.postalCode} ${address.city}`,
          })),
        ),
        OBJECT: sortOptions(
          objects.map((object) => ({
            type: 'OBJECT' as const,
            id: object.id,
            label: object.name,
            detail: object.type,
          })),
        ),
        OBJECT_AREA: sortOptions(
          objectAreas.map((area) => ({
            type: 'OBJECT_AREA' as const,
            id: area.id,
            label: `${area.object.name} / ${area.name}`,
            detail: area.type,
          })),
        ),
        ITEM: sortOptions(
          items.map((item) => ({
            type: 'ITEM' as const,
            id: item.id,
            label: item.name,
            detail: item.customId,
          })),
        ),
      },
    };
  }

  async getEntityForCompanyOrThrow(
    companyId: string,
    type: AssignmentEntityType,
    id: string,
    role: EntityRole,
  ): Promise<AssignmentEntityOption> {
    const options = await this.getOptionsForType(companyId, type, id);
    const entity = options[0];

    if (!entity) {
      const label = role === 'source' ? 'Quelle' : 'Ziel';
      throw new NotFoundException(
        `${label} wurde fuer den angegebenen Typ in der aktiven Firma nicht gefunden.`,
      );
    }

    return entity;
  }

  buildEntityMap(options: AssignmentEntityOptionsResponse) {
    const map = new Map<string, AssignmentEntityOption>();
    Object.values(options.entities).flat().forEach((entity) => {
      map.set(entityKey(entity.type, entity.id), entity);
    });
    return map;
  }

  getEntityFromMap(
    map: Map<string, AssignmentEntityOption>,
    type: AssignmentEntityType,
    id: string,
  ) {
    return map.get(entityKey(type, id));
  }

  private async getOptionsForType(
    companyId: string,
    type: AssignmentEntityType,
    id: string,
  ): Promise<AssignmentEntityOption[]> {
    switch (type) {
      case 'USER': {
        const membership = await this.prisma.membership.findFirst({
          where: { companyId, userId: id, isActive: true, user: { isActive: true } },
          include: { user: true },
        });
        return membership
          ? [{ type, id, label: membership.user.displayName ?? membership.user.email, detail: membership.user.email }]
          : [];
      }
      case 'TEAM': {
        const team = await this.prisma.team.findFirst({ where: { companyId, id } });
        return team ? [{ type, id, label: team.name, detail: team.code ?? undefined }] : [];
      }
      case 'JOB': {
        const job = await this.prisma.job.findFirst({ where: { companyId, id } });
        return job ? [{ type, id, label: job.title, detail: job.reference }] : [];
      }
      case 'CUSTOMER': {
        const customer = await this.prisma.customer.findFirst({ where: { companyId, id } });
        return customer ? [{ type, id, label: customer.name, detail: customer.type }] : [];
      }
      case 'ADDRESS': {
        const address = await this.prisma.address.findFirst({ where: { companyId, id } });
        return address
          ? [{ type, id, label: address.label, detail: `${address.street}, ${address.postalCode} ${address.city}` }]
          : [];
      }
      case 'OBJECT': {
        const object = await this.prisma.object.findFirst({ where: { companyId, id } });
        return object ? [{ type, id, label: object.name, detail: object.type }] : [];
      }
      case 'OBJECT_AREA': {
        const area = await this.prisma.objectArea.findFirst({
          where: { companyId, id },
          include: { object: { select: { name: true } } },
        });
        return area
          ? [{ type, id, label: `${area.object.name} / ${area.name}`, detail: area.type }]
          : [];
      }
      case 'ITEM': {
        const item = await this.prisma.item.findFirst({ where: { companyId, id } });
        return item ? [{ type, id, label: item.name, detail: item.customId }] : [];
      }
    }
  }
}
