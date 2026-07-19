import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type {
  ItemCategoryCreateInput,
  ItemCategoryListResponse,
  ItemCategoryUpdateInput,
  ItemCreateInput,
  ItemDetailResponse,
  ItemListResponse,
  ItemUpdateInput,
  RequestAuthContext,
} from '@einsatzpilot/types';

import {
  assertCanReadItems,
  assertCanWriteItems,
} from '../operations/operations-permissions';
import { PrismaService } from '../prisma/prisma.service';
import { createItemCustomId } from './item-reference';
import {
  mapItemCategoryListItem,
  mapItemDetailResponse,
  mapItemListItem,
} from './items-mapper';
import {
  assertValidTrackingQuantity,
  normalizeItemCategoryCreateInput,
  normalizeItemCategoryUpdateInput,
  normalizeItemCreateInput,
  normalizeItemUpdateInput,
} from './items-payloads';

const categoryInclude = {
  _count: {
    select: {
      items: true,
    },
  },
} as const;

const itemInclude = {
  category: {
    select: {
      id: true,
      name: true,
      kind: true,
      isActive: true,
    },
  },
} as const;

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

@Injectable()
export class ItemsService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  private async getCategoryForCompanyOrThrow(companyId: string, categoryId: string) {
    const category = await this.prisma.itemCategory.findFirst({
      where: {
        id: categoryId,
        companyId,
      },
      include: categoryInclude,
    });

    if (!category) {
      throw new NotFoundException('Kategorie wurde in der aktiven Firma nicht gefunden.');
    }

    return category;
  }

  private async getItemForCompanyOrThrow(companyId: string, itemId: string) {
    const item = await this.prisma.item.findFirst({
      where: {
        id: itemId,
        companyId,
      },
      include: itemInclude,
    });

    if (!item) {
      throw new NotFoundException('Artikel wurde in der aktiven Firma nicht gefunden.');
    }

    return item;
  }

  async getCategories(input: {
    companyId: string;
    authContext: RequestAuthContext;
  }): Promise<ItemCategoryListResponse> {
    assertCanReadItems(input.authContext);
    const categories = await this.prisma.itemCategory.findMany({
      where: {
        companyId: input.companyId,
      },
      include: categoryInclude,
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    });

    return {
      categories: categories.map(mapItemCategoryListItem),
    };
  }

  async createCategory(input: {
    companyId: string;
    authContext: RequestAuthContext;
    payload: ItemCategoryCreateInput;
  }) {
    assertCanWriteItems(input.authContext);
    const payload = normalizeItemCategoryCreateInput(input.payload);

    try {
      const category = await this.prisma.itemCategory.create({
        data: {
          companyId: input.companyId,
          ...payload,
        },
        include: categoryInclude,
      });

      return mapItemCategoryListItem(category);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Eine Kategorie mit diesem Namen existiert bereits.');
      }
      throw error;
    }
  }

  async updateCategory(input: {
    companyId: string;
    categoryId: string;
    authContext: RequestAuthContext;
    payload: ItemCategoryUpdateInput;
  }) {
    assertCanWriteItems(input.authContext);
    const payload = normalizeItemCategoryUpdateInput(input.payload);
    const category = await this.getCategoryForCompanyOrThrow(
      input.companyId,
      input.categoryId,
    );

    try {
      const updated = await this.prisma.itemCategory.update({
        where: { id: category.id },
        data: payload,
        include: categoryInclude,
      });

      return mapItemCategoryListItem(updated);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Eine Kategorie mit diesem Namen existiert bereits.');
      }
      throw error;
    }
  }

  async getItems(input: {
    companyId: string;
    authContext: RequestAuthContext;
  }): Promise<ItemListResponse> {
    assertCanReadItems(input.authContext);
    const items = await this.prisma.item.findMany({
      where: {
        companyId: input.companyId,
      },
      include: itemInclude,
      orderBy: [{ status: 'asc' }, { name: 'asc' }, { customId: 'asc' }],
    });

    return {
      items: items.map(mapItemListItem),
    };
  }

  async getItemDetail(input: {
    companyId: string;
    itemId: string;
    authContext: RequestAuthContext;
  }): Promise<ItemDetailResponse> {
    assertCanReadItems(input.authContext);
    const item = await this.getItemForCompanyOrThrow(input.companyId, input.itemId);
    return mapItemDetailResponse(item);
  }

  async createItem(input: {
    companyId: string;
    authContext: RequestAuthContext;
    payload: ItemCreateInput;
  }) {
    assertCanWriteItems(input.authContext);
    const payload = normalizeItemCreateInput(input.payload);
    const quantity = payload.quantity ?? (payload.trackingMode === 'SERIALIZED' ? 1 : 0);
    assertValidTrackingQuantity(payload.trackingMode, quantity);

    if (payload.categoryId) {
      await this.getCategoryForCompanyOrThrow(input.companyId, payload.categoryId);
    }

    const maxAttempts = payload.customId ? 1 : 5;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const customId = payload.customId ?? createItemCustomId();

      try {
        const item = await this.prisma.item.create({
          data: {
            ...payload,
            companyId: input.companyId,
            customId,
            quantity,
          },
          include: itemInclude,
        });

        return mapItemListItem(item);
      } catch (error) {
        if (!isUniqueConstraintError(error)) {
          throw error;
        }

        if (payload.customId) {
          throw new ConflictException('Ein Artikel mit dieser customId existiert bereits.');
        }
      }
    }

    throw new ConflictException('Automatische customId konnte nicht eindeutig erzeugt werden.');
  }

  async updateItem(input: {
    companyId: string;
    itemId: string;
    authContext: RequestAuthContext;
    payload: ItemUpdateInput;
  }) {
    assertCanWriteItems(input.authContext);
    const payload = normalizeItemUpdateInput(input.payload);
    const item = await this.getItemForCompanyOrThrow(input.companyId, input.itemId);

    if (payload.categoryId) {
      await this.getCategoryForCompanyOrThrow(input.companyId, payload.categoryId);
    }

    const trackingMode = payload.trackingMode ?? item.trackingMode;
    const quantity = payload.quantity ?? item.quantity.toNumber();
    assertValidTrackingQuantity(trackingMode, quantity);

    try {
      const updated = await this.prisma.item.update({
        where: { id: item.id },
        data: payload,
        include: itemInclude,
      });

      return mapItemListItem(updated);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Ein Artikel mit dieser customId existiert bereits.');
      }
      throw error;
    }
  }
}
