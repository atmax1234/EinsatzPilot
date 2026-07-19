import { randomUUID } from 'node:crypto';

export function createItemCustomId() {
  return `ITEM-${randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase()}`;
}
