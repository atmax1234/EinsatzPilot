import type {
  ItemCategoryListItem,
  ItemDetailResponse,
  ItemListItem,
} from '@einsatzpilot/types';

type ItemCategoryRecord = {
  id: string;
  name: string;
  description: string | null;
  kind: ItemCategoryListItem['kind'];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    items: number;
  };
};

type ItemRecord = {
  id: string;
  customId: string;
  name: string;
  description: string | null;
  kind: ItemListItem['kind'];
  unit: ItemListItem['unit'];
  trackingMode: ItemListItem['trackingMode'];
  quantity: { toNumber(): number };
  status: ItemListItem['status'];
  notes: string | null;
  category: {
    id: string;
    name: string;
    kind: ItemCategoryListItem['kind'];
    isActive: boolean;
  } | null;
  createdAt: Date;
  updatedAt: Date;
};

export function mapItemCategoryListItem(
  record: ItemCategoryRecord,
): ItemCategoryListItem {
  return {
    id: record.id,
    name: record.name,
    description: record.description ?? undefined,
    kind: record.kind,
    isActive: record.isActive,
    itemCount: record._count.items,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export function mapItemListItem(record: ItemRecord): ItemListItem {
  return {
    id: record.id,
    customId: record.customId,
    name: record.name,
    description: record.description ?? undefined,
    kind: record.kind,
    unit: record.unit,
    trackingMode: record.trackingMode,
    quantity: record.quantity.toNumber(),
    status: record.status,
    notes: record.notes ?? undefined,
    category: record.category ?? undefined,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export function mapItemDetailResponse(record: ItemRecord): ItemDetailResponse {
  return {
    item: mapItemListItem(record),
  };
}
