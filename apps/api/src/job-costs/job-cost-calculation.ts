import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type { JobCostKind, JobCostSummary } from '@einsatzpilot/types';

const derivedKinds: JobCostKind[] = [
  'MATERIAL_PURCHASE',
  'MATERIAL_USED',
  'LABOR',
  'TRAVEL',
];
const maxMoney = new Prisma.Decimal('999999999999.99');

function toDecimal(value: number) {
  return new Prisma.Decimal(value.toString());
}

function roundedTotal(quantity: Prisma.Decimal, unitCost: Prisma.Decimal) {
  const total = quantity.mul(unitCost).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

  if (total.greaterThan(maxMoney)) {
    throw new BadRequestException('Der abgeleitete totalCost ueberschreitet den erlaubten Wert.');
  }

  return total;
}

export function resolveJobCostAmounts(input: {
  kind: JobCostKind;
  quantity: number;
  unitCost: number | null;
  submittedTotalCost?: number;
  existingTotalCost?: Prisma.Decimal;
}) {
  const normalizedQuantity = toDecimal(input.quantity);
  const normalizedUnitCost = input.unitCost === null ? null : toDecimal(input.unitCost);
  const submittedTotal =
    input.submittedTotalCost === undefined ? undefined : toDecimal(input.submittedTotalCost);

  if (derivedKinds.includes(input.kind) && normalizedUnitCost === null) {
    throw new BadRequestException(
      'Material-, Arbeits- und Fahrtkosten benoetigen unitCost; totalCost wird abgeleitet.',
    );
  }

  if (normalizedUnitCost !== null) {
    const derivedTotal = roundedTotal(normalizedQuantity, normalizedUnitCost);

    if (submittedTotal && !submittedTotal.equals(derivedTotal)) {
      throw new BadRequestException(
        'totalCost stimmt nicht mit quantity multipliziert mit unitCost ueberein.',
      );
    }

    return {
      quantity: normalizedQuantity,
      unitCost: normalizedUnitCost,
      totalCost: derivedTotal,
    };
  }

  const manualTotal = submittedTotal ?? input.existingTotalCost;
  if (!manualTotal) {
    throw new BadRequestException(
      'Externe, Gebuehren- und sonstige Kosten benoetigen unitCost oder einen manuellen totalCost.',
    );
  }

  return {
    quantity: normalizedQuantity,
    unitCost: null,
    totalCost: manualTotal,
  };
}

export function buildJobCostSummary(
  costLines: Array<{ kind: JobCostKind; totalCost: Prisma.Decimal; currency: string }>,
): JobCostSummary {
  const totals = {
    materialTotal: new Prisma.Decimal(0),
    laborTotal: new Prisma.Decimal(0),
    travelTotal: new Prisma.Decimal(0),
    externalServiceTotal: new Prisma.Decimal(0),
    otherTotal: new Prisma.Decimal(0),
  };

  costLines.forEach((line) => {
    if (line.kind === 'MATERIAL_PURCHASE' || line.kind === 'MATERIAL_USED') {
      totals.materialTotal = totals.materialTotal.add(line.totalCost);
    } else if (line.kind === 'LABOR') {
      totals.laborTotal = totals.laborTotal.add(line.totalCost);
    } else if (line.kind === 'TRAVEL') {
      totals.travelTotal = totals.travelTotal.add(line.totalCost);
    } else if (line.kind === 'EXTERNAL_SERVICE') {
      totals.externalServiceTotal = totals.externalServiceTotal.add(line.totalCost);
    } else {
      totals.otherTotal = totals.otherTotal.add(line.totalCost);
    }
  });

  const grandTotal = Object.values(totals).reduce(
    (sum, value) => sum.add(value),
    new Prisma.Decimal(0),
  );

  return {
    materialTotal: totals.materialTotal.toNumber(),
    laborTotal: totals.laborTotal.toNumber(),
    travelTotal: totals.travelTotal.toNumber(),
    externalServiceTotal: totals.externalServiceTotal.toNumber(),
    otherTotal: totals.otherTotal.toNumber(),
    grandTotal: grandTotal.toNumber(),
    currency: costLines[0]?.currency ?? 'EUR',
    lineCount: costLines.length,
  };
}
