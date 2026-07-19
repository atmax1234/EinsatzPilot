'use server';

import type {
  ItemKind,
  ItemStatus,
  ItemTrackingMode,
  ItemUnit,
} from '@einsatzpilot/types';
import { redirect } from 'next/navigation';

import {
  createItemCategoryData,
  createItemData,
  updateItemCategoryData,
  updateItemData,
} from './items';

function requiredString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${key} ist erforderlich.`);
  }

  return value.trim();
}

function optionalString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function optionalNullableString(formData: FormData, key: string) {
  return optionalString(formData, key) ?? null;
}

function requiredNumber(formData: FormData, key: string) {
  const value = Number(requiredString(formData, key));
  if (!Number.isFinite(value)) {
    throw new Error(`${key} muss eine Zahl sein.`);
  }
  return value;
}

function redirectWith(values: Record<string, string | undefined>): never {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });
  redirect(params.size ? `/items?${params.toString()}` : '/items');
}

function itemKind(formData: FormData): ItemKind {
  const value = requiredString(formData, 'kind');
  if (
    value === 'MATERIAL' ||
    value === 'TOOL' ||
    value === 'ASSET' ||
    value === 'CONSUMABLE' ||
    value === 'PACKAGE' ||
    value === 'OTHER'
  ) {
    return value;
  }
  throw new Error('Artikelart ist ungueltig.');
}

function itemUnit(formData: FormData): ItemUnit {
  const value = requiredString(formData, 'unit');
  if (
    value === 'PIECE' ||
    value === 'KG' ||
    value === 'LITER' ||
    value === 'METER' ||
    value === 'SQUARE_METER' ||
    value === 'CUBIC_METER' ||
    value === 'PALLET' ||
    value === 'BOX' ||
    value === 'BAG' ||
    value === 'OTHER'
  ) {
    return value;
  }
  throw new Error('Einheit ist ungueltig.');
}

function itemTrackingMode(formData: FormData): ItemTrackingMode {
  const value = requiredString(formData, 'trackingMode');
  if (value === 'QUANTITY' || value === 'SERIALIZED') {
    return value;
  }
  throw new Error('Tracking-Modus ist ungueltig.');
}

function itemStatus(formData: FormData): ItemStatus {
  const value = requiredString(formData, 'status');
  if (
    value === 'ACTIVE' ||
    value === 'INACTIVE' ||
    value === 'DAMAGED' ||
    value === 'LOST' ||
    value === 'ARCHIVED'
  ) {
    return value;
  }
  throw new Error('Artikelstatus ist ungueltig.');
}

export async function createItemCategoryAction(formData: FormData) {
  try {
    const result = await createItemCategoryData({
      name: requiredString(formData, 'name'),
      description: optionalString(formData, 'description'),
      kind: itemKind(formData),
      isActive: true,
    });
    redirectWith(result.ok ? { notice: 'category-created' } : { error: result.error });
  } catch (error) {
    redirectWith({
      error: error instanceof Error ? error.message : 'Kategorie konnte nicht erstellt werden.',
    });
  }
}

export async function updateItemCategoryAction(categoryId: string, formData: FormData) {
  try {
    const result = await updateItemCategoryData(categoryId, {
      name: requiredString(formData, 'name'),
      description: optionalNullableString(formData, 'description'),
      kind: itemKind(formData),
      isActive: requiredString(formData, 'isActive') === 'true',
    });
    redirectWith(result.ok ? { notice: 'category-updated' } : { error: result.error });
  } catch (error) {
    redirectWith({
      error: error instanceof Error ? error.message : 'Kategorie konnte nicht aktualisiert werden.',
    });
  }
}

export async function createItemAction(formData: FormData) {
  try {
    const result = await createItemData({
      categoryId: optionalString(formData, 'categoryId'),
      customId: optionalString(formData, 'customId'),
      name: requiredString(formData, 'name'),
      description: optionalString(formData, 'description'),
      kind: itemKind(formData),
      unit: itemUnit(formData),
      trackingMode: itemTrackingMode(formData),
      quantity: requiredNumber(formData, 'quantity'),
      status: itemStatus(formData),
      notes: optionalString(formData, 'notes'),
    });
    redirectWith(result.ok ? { notice: 'item-created' } : { error: result.error });
  } catch (error) {
    redirectWith({
      error: error instanceof Error ? error.message : 'Artikel konnte nicht erstellt werden.',
    });
  }
}

export async function updateItemAction(itemId: string, formData: FormData) {
  try {
    const result = await updateItemData(itemId, {
      categoryId: optionalNullableString(formData, 'categoryId'),
      customId: requiredString(formData, 'customId'),
      name: requiredString(formData, 'name'),
      description: optionalNullableString(formData, 'description'),
      kind: itemKind(formData),
      unit: itemUnit(formData),
      trackingMode: itemTrackingMode(formData),
      quantity: requiredNumber(formData, 'quantity'),
      status: itemStatus(formData),
      notes: optionalNullableString(formData, 'notes'),
    });
    redirectWith(result.ok ? { notice: 'item-updated' } : { error: result.error });
  } catch (error) {
    redirectWith({
      error: error instanceof Error ? error.message : 'Artikel konnte nicht aktualisiert werden.',
    });
  }
}
