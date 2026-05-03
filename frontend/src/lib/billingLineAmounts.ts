import type { OrderLine } from "../types";

/**
 * Customer billing row: use persisted after-markup from DB when present,
 * otherwise purchase cost + category/global markup % (same as admin pricing table).
 */
export function billedAmountsForLine(
  line: OrderLine,
  billingCategoryMarkups: Record<string, number>,
  globalMarkupPercent: number,
): { billedUnit: number; billedLine: number; pct: number } {
  const storedLine = line.lineTotalAfterMarkup;
  if (storedLine != null && Number.isFinite(Number(storedLine))) {
    const billedLine = Number(storedLine);
    const storedUnit = line.unitPriceAfterMarkup;
    const linePct = Number(line.markupPercent ?? 0);
    const billedUnit =
      storedUnit != null && Number.isFinite(Number(storedUnit))
        ? Number(storedUnit)
        : (() => {
            const pu = Number(line.unitPrice ?? 0);
            const pct = linePct || Number(billingCategoryMarkups[line.categoryId] ?? globalMarkupPercent ?? 0);
            return pu + Math.round(pu * (pct / 100));
          })();
    const pct =
      linePct ||
      Number(billingCategoryMarkups[line.categoryId] ?? globalMarkupPercent ?? 0);
    return { billedUnit, billedLine, pct };
  }

  const purchaseUnit = Number(line.unitPrice ?? 0);
  const purchaseLine = Number(line.lineTotal ?? 0);
  const pct = Number(billingCategoryMarkups[line.categoryId] ?? globalMarkupPercent ?? 0);
  return {
    billedUnit: purchaseUnit + Math.round(purchaseUnit * (pct / 100)),
    billedLine: purchaseLine + Math.round(purchaseLine * (pct / 100)),
    pct,
  };
}
