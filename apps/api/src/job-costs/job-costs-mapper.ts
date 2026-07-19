import type { JobCostLineItem } from '@einsatzpilot/types';

type DecimalValue = { toNumber(): number };

export function mapJobCostLine(record: {
  id: string;
  kind: JobCostLineItem['kind'];
  description: string;
  quantity: DecimalValue;
  unit: JobCostLineItem['unit'];
  unitCost: DecimalValue | null;
  totalCost: DecimalValue;
  currency: string;
  taxRate: DecimalValue | null;
  costDate: Date;
  vendorName: string | null;
  receiptReference: string | null;
  notes: string | null;
  item: { id: string; customId: string; name: string } | null;
  createdBy: { id: string; email: string; displayName: string | null };
  updatedBy: { id: string; email: string; displayName: string | null };
  createdAt: Date;
  updatedAt: Date;
}): JobCostLineItem {
  return {
    id: record.id,
    kind: record.kind,
    description: record.description,
    quantity: record.quantity.toNumber(),
    unit: record.unit,
    unitCost: record.unitCost?.toNumber(),
    totalCost: record.totalCost.toNumber(),
    currency: record.currency,
    taxRate: record.taxRate?.toNumber(),
    costDate: record.costDate.toISOString(),
    vendorName: record.vendorName ?? undefined,
    receiptReference: record.receiptReference ?? undefined,
    notes: record.notes ?? undefined,
    item: record.item ?? undefined,
    createdBy: {
      id: record.createdBy.id,
      name: record.createdBy.displayName ?? record.createdBy.email,
      email: record.createdBy.email,
    },
    updatedBy: {
      id: record.updatedBy.id,
      name: record.updatedBy.displayName ?? record.updatedBy.email,
      email: record.updatedBy.email,
    },
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}
