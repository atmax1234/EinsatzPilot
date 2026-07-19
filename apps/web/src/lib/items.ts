import type {
  ItemCategoryCreateInput,
  ItemCategoryListItem,
  ItemCategoryListResponse,
  ItemCategoryUpdateInput,
  ItemCreateInput,
  ItemDetailResponse,
  ItemKind,
  ItemListItem,
  ItemListResponse,
  ItemStatus,
  ItemTrackingMode,
  ItemUnit,
  ItemUpdateInput,
} from '@einsatzpilot/types';

import { fetchApiJson } from './api';
import { getStoredSessionToken } from './server-auth';

async function getAuthTokenOrThrow() {
  const token = await getStoredSessionToken();

  if (!token) {
    throw new Error('Session-Token fehlt.');
  }

  return token;
}

export function getItemKindLabel(kind: ItemKind) {
  return {
    MATERIAL: 'Material',
    TOOL: 'Werkzeug',
    ASSET: 'Anlagegut',
    CONSUMABLE: 'Verbrauchsmaterial',
    PACKAGE: 'Paket',
    OTHER: 'Sonstiges',
  }[kind];
}

export function getItemUnitLabel(unit: ItemUnit) {
  return {
    PIECE: 'Stueck',
    KG: 'kg',
    LITER: 'Liter',
    METER: 'Meter',
    SQUARE_METER: 'Quadratmeter',
    CUBIC_METER: 'Kubikmeter',
    PALLET: 'Palette',
    BOX: 'Karton',
    BAG: 'Sack',
    OTHER: 'Andere Einheit',
  }[unit];
}

export function getItemTrackingModeLabel(mode: ItemTrackingMode) {
  return mode === 'QUANTITY' ? 'Mengenartikel' : 'Serialisiert';
}

export function getItemStatusLabel(status: ItemStatus) {
  return {
    ACTIVE: 'Aktiv',
    INACTIVE: 'Inaktiv',
    DAMAGED: 'Beschaedigt',
    LOST: 'Verloren',
    ARCHIVED: 'Archiviert',
  }[status];
}

export async function getItemCategoriesData() {
  const token = await getAuthTokenOrThrow();
  return fetchApiJson<ItemCategoryListResponse>('/api/item-categories', {
    authToken: token,
  });
}

export async function createItemCategoryData(input: ItemCategoryCreateInput) {
  const token = await getAuthTokenOrThrow();
  return fetchApiJson<ItemCategoryListItem>('/api/item-categories', {
    authToken: token,
    method: 'POST',
    json: input,
  });
}

export async function updateItemCategoryData(
  categoryId: string,
  input: ItemCategoryUpdateInput,
) {
  const token = await getAuthTokenOrThrow();
  return fetchApiJson<ItemCategoryListItem>(`/api/item-categories/${categoryId}`, {
    authToken: token,
    method: 'PATCH',
    json: input,
  });
}

export async function getItemsData() {
  const token = await getAuthTokenOrThrow();
  return fetchApiJson<ItemListResponse>('/api/items', { authToken: token });
}

export async function getItemDetailData(itemId: string) {
  const token = await getAuthTokenOrThrow();
  return fetchApiJson<ItemDetailResponse>(`/api/items/${itemId}`, { authToken: token });
}

export async function createItemData(input: ItemCreateInput) {
  const token = await getAuthTokenOrThrow();
  return fetchApiJson<ItemListItem>('/api/items', {
    authToken: token,
    method: 'POST',
    json: input,
  });
}

export async function updateItemData(itemId: string, input: ItemUpdateInput) {
  const token = await getAuthTokenOrThrow();
  return fetchApiJson<ItemListItem>(`/api/items/${itemId}`, {
    authToken: token,
    method: 'PATCH',
    json: input,
  });
}
