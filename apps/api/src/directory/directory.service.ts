import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import type {
  AddressCreateInput,
  AddressListResponse,
  AddressUpdateInput,
  CustomerCreateInput,
  CustomerListResponse,
  CustomerUpdateInput,
  ObjectAreaCreateInput,
  ObjectAreaListResponse,
  ObjectAreaUpdateInput,
  ObjectCreateInput,
  ObjectListResponse,
  ObjectUpdateInput,
  RequestAuthContext,
} from '@einsatzpilot/types';

import { PrismaService } from '../prisma/prisma.service';
import {
  assertCanReadMasterData,
  assertCanWriteMasterData,
} from '../operations/operations-permissions';
import {
  mapAddressListItem,
  mapCustomerListItem,
  mapObjectAreaItem,
  mapObjectDetailResponse,
  mapObjectListItem,
} from './directory-mapper';
import {
  normalizeAddressCreateInput,
  normalizeAddressUpdateInput,
  normalizeCustomerCreateInput,
  normalizeCustomerUpdateInput,
  normalizeObjectAreaCreateInput,
  normalizeObjectAreaUpdateInput,
  normalizeObjectCreateInput,
  normalizeObjectUpdateInput,
} from './directory-payloads';

const customerInclude = {
  _count: {
    select: {
      addresses: true,
      objects: true,
    },
  },
} as const;

const addressInclude = {
  customer: {
    select: {
      id: true,
      name: true,
    },
  },
  _count: {
    select: {
      objects: true,
    },
  },
} as const;

const objectInclude = {
  customer: {
    select: {
      id: true,
      name: true,
    },
  },
  address: {
    include: addressInclude,
  },
  _count: {
    select: {
      areas: true,
    },
  },
} as const;

@Injectable()
export class DirectoryService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  private async getCustomerForCompanyOrThrow(companyId: string, customerId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id: customerId,
        companyId,
      },
      include: customerInclude,
    });

    if (!customer) {
      throw new NotFoundException('Kunde wurde in der aktiven Firma nicht gefunden.');
    }

    return customer;
  }

  private async getAddressForCompanyOrThrow(companyId: string, addressId: string) {
    const address = await this.prisma.address.findFirst({
      where: {
        id: addressId,
        companyId,
      },
      include: addressInclude,
    });

    if (!address) {
      throw new NotFoundException('Adresse wurde in der aktiven Firma nicht gefunden.');
    }

    return address;
  }

  private async getObjectForCompanyOrThrow(companyId: string, objectId: string) {
    const object = await this.prisma.object.findFirst({
      where: {
        id: objectId,
        companyId,
      },
      include: objectInclude,
    });

    if (!object) {
      throw new NotFoundException('Objekt wurde in der aktiven Firma nicht gefunden.');
    }

    return object;
  }

  private assertAddressMatchesCustomer(input: {
    customerId?: string | null;
    address?: { customerId: string | null } | null;
  }) {
    if (
      input.customerId &&
      input.address?.customerId &&
      input.address.customerId !== input.customerId
    ) {
      throw new BadRequestException(
        'Die Adresse ist einem anderen Kunden zugeordnet als das Objekt.',
      );
    }
  }

  async getCustomers(input: {
    companyId: string;
    authContext: RequestAuthContext;
  }): Promise<CustomerListResponse> {
    assertCanReadMasterData(input.authContext);
    const customers = await this.prisma.customer.findMany({
      where: {
        companyId: input.companyId,
      },
      include: customerInclude,
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    });

    return {
      customers: customers.map(mapCustomerListItem),
    };
  }

  async createCustomer(input: {
    companyId: string;
    authContext: RequestAuthContext;
    payload: CustomerCreateInput;
  }) {
    assertCanWriteMasterData(input.authContext);
    const payload = normalizeCustomerCreateInput(input.payload);
    const customer = await this.prisma.customer.create({
      data: {
        companyId: input.companyId,
        ...payload,
      },
      include: customerInclude,
    });

    return mapCustomerListItem(customer);
  }

  async updateCustomer(input: {
    companyId: string;
    customerId: string;
    authContext: RequestAuthContext;
    payload: CustomerUpdateInput;
  }) {
    assertCanWriteMasterData(input.authContext);
    const payload = normalizeCustomerUpdateInput(input.payload);
    const customer = await this.getCustomerForCompanyOrThrow(
      input.companyId,
      input.customerId,
    );
    const updated = await this.prisma.customer.update({
      where: { id: customer.id },
      data: payload,
      include: customerInclude,
    });

    return mapCustomerListItem(updated);
  }

  async getAddresses(input: {
    companyId: string;
    authContext: RequestAuthContext;
  }): Promise<AddressListResponse> {
    assertCanReadMasterData(input.authContext);
    const addresses = await this.prisma.address.findMany({
      where: {
        companyId: input.companyId,
      },
      include: addressInclude,
      orderBy: [{ label: 'asc' }, { city: 'asc' }, { street: 'asc' }],
    });

    return {
      addresses: addresses.map(mapAddressListItem),
    };
  }

  async createAddress(input: {
    companyId: string;
    authContext: RequestAuthContext;
    payload: AddressCreateInput;
  }) {
    assertCanWriteMasterData(input.authContext);
    const payload = normalizeAddressCreateInput(input.payload);

    if (payload.customerId) {
      await this.getCustomerForCompanyOrThrow(input.companyId, payload.customerId);
    }

    const address = await this.prisma.address.create({
      data: {
        companyId: input.companyId,
        ...payload,
      },
      include: addressInclude,
    });

    return mapAddressListItem(address);
  }

  async updateAddress(input: {
    companyId: string;
    addressId: string;
    authContext: RequestAuthContext;
    payload: AddressUpdateInput;
  }) {
    assertCanWriteMasterData(input.authContext);
    const payload = normalizeAddressUpdateInput(input.payload);
    const address = await this.getAddressForCompanyOrThrow(input.companyId, input.addressId);

    if (payload.customerId) {
      await this.getCustomerForCompanyOrThrow(input.companyId, payload.customerId);
      const conflictingObject = await this.prisma.object.findFirst({
        where: {
          companyId: input.companyId,
          addressId: address.id,
          customerId: {
            not: payload.customerId,
          },
        },
        select: { id: true },
      });

      if (conflictingObject) {
        throw new BadRequestException(
          'Die Adresse wird von einem Objekt eines anderen Kunden verwendet.',
        );
      }
    }

    const updated = await this.prisma.address.update({
      where: { id: address.id },
      data: payload,
      include: addressInclude,
    });

    return mapAddressListItem(updated);
  }

  async getObjects(input: {
    companyId: string;
    authContext: RequestAuthContext;
  }): Promise<ObjectListResponse> {
    assertCanReadMasterData(input.authContext);
    const objects = await this.prisma.object.findMany({
      where: {
        companyId: input.companyId,
      },
      include: objectInclude,
      orderBy: [{ status: 'asc' }, { name: 'asc' }],
    });

    return {
      objects: objects.map(mapObjectListItem),
    };
  }

  async getObjectDetail(input: {
    companyId: string;
    objectId: string;
    authContext: RequestAuthContext;
  }) {
    assertCanReadMasterData(input.authContext);
    const object = await this.prisma.object.findFirst({
      where: {
        id: input.objectId,
        companyId: input.companyId,
      },
      include: {
        ...objectInclude,
        areas: {
          orderBy: [{ name: 'asc' }],
        },
      },
    });

    if (!object) {
      throw new NotFoundException('Objekt wurde in der aktiven Firma nicht gefunden.');
    }

    return mapObjectDetailResponse(object);
  }

  async createObject(input: {
    companyId: string;
    authContext: RequestAuthContext;
    payload: ObjectCreateInput;
  }) {
    assertCanWriteMasterData(input.authContext);
    const payload = normalizeObjectCreateInput(input.payload);
    const customer = payload.customerId
      ? await this.getCustomerForCompanyOrThrow(input.companyId, payload.customerId)
      : null;
    const address = payload.addressId
      ? await this.getAddressForCompanyOrThrow(input.companyId, payload.addressId)
      : null;

    this.assertAddressMatchesCustomer({
      customerId: customer?.id,
      address,
    });

    const object = await this.prisma.object.create({
      data: {
        companyId: input.companyId,
        ...payload,
      },
      include: objectInclude,
    });

    return mapObjectListItem(object);
  }

  async updateObject(input: {
    companyId: string;
    objectId: string;
    authContext: RequestAuthContext;
    payload: ObjectUpdateInput;
  }) {
    assertCanWriteMasterData(input.authContext);
    const payload = normalizeObjectUpdateInput(input.payload);
    const object = await this.getObjectForCompanyOrThrow(input.companyId, input.objectId);
    const nextCustomer =
      payload.customerId === undefined
        ? object.customer
        : payload.customerId === null
          ? null
          : await this.getCustomerForCompanyOrThrow(input.companyId, payload.customerId);
    const nextAddress =
      payload.addressId === undefined
        ? object.address
        : payload.addressId === null
          ? null
          : await this.getAddressForCompanyOrThrow(input.companyId, payload.addressId);

    this.assertAddressMatchesCustomer({
      customerId: nextCustomer?.id,
      address: nextAddress,
    });

    const updated = await this.prisma.object.update({
      where: { id: object.id },
      data: payload,
      include: objectInclude,
    });

    return mapObjectListItem(updated);
  }

  async getObjectAreas(input: {
    companyId: string;
    objectId: string;
    authContext: RequestAuthContext;
  }): Promise<ObjectAreaListResponse> {
    assertCanReadMasterData(input.authContext);
    await this.getObjectForCompanyOrThrow(input.companyId, input.objectId);
    const areas = await this.prisma.objectArea.findMany({
      where: {
        companyId: input.companyId,
        objectId: input.objectId,
      },
      orderBy: [{ name: 'asc' }],
    });

    return {
      areas: areas.map(mapObjectAreaItem),
    };
  }

  async createObjectArea(input: {
    companyId: string;
    objectId: string;
    authContext: RequestAuthContext;
    payload: ObjectAreaCreateInput;
  }) {
    assertCanWriteMasterData(input.authContext);
    const payload = normalizeObjectAreaCreateInput(input.payload);
    const object = await this.getObjectForCompanyOrThrow(input.companyId, input.objectId);
    const area = await this.prisma.objectArea.create({
      data: {
        companyId: input.companyId,
        objectId: object.id,
        ...payload,
      },
    });

    return mapObjectAreaItem(area);
  }

  async updateObjectArea(input: {
    companyId: string;
    objectId: string;
    areaId: string;
    authContext: RequestAuthContext;
    payload: ObjectAreaUpdateInput;
  }) {
    assertCanWriteMasterData(input.authContext);
    const payload = normalizeObjectAreaUpdateInput(input.payload);
    await this.getObjectForCompanyOrThrow(input.companyId, input.objectId);
    const area = await this.prisma.objectArea.findFirst({
      where: {
        id: input.areaId,
        companyId: input.companyId,
        objectId: input.objectId,
      },
    });

    if (!area) {
      throw new NotFoundException('Objektbereich wurde im Objekt nicht gefunden.');
    }

    const updated = await this.prisma.objectArea.update({
      where: { id: area.id },
      data: payload,
    });

    return mapObjectAreaItem(updated);
  }
}
