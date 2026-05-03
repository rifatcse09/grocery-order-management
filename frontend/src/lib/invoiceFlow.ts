import type { Order, OrderLine } from "../types";
import { validateLineQuantity } from "./quantityRules";

export function hasPurchaseInvoice(order: Order): boolean {
  return Boolean(order.purchaseInvoiceGenerated);
}

export function hasBillingInvoice(order: Order): boolean {
  return Boolean(order.billingInvoiceGenerated || order.invoiceGenerated);
}

/** Same weight/piece rules as OrderLinesEditor (supports comma decimals). */
export function computePurchaseLineTotal(line: OrderLine, unit: number): number {
  const kg = parseFloat(String(line.kg).replace(",", ".")) || 0;
  const g = (parseFloat(String(line.gram).replace(",", ".")) || 0) / 1000;
  const pc = parseFloat(String(line.piece).replace(",", ".")) || 0;
  if (pc > 0) return Math.round(unit * pc * 100) / 100;
  return Math.round(unit * (kg + g) * 100) / 100;
}

/**
 * True when a purchase invoice may be generated: every line has valid quantities and a supplier
 * cost (unit price) &gt; 0 with a positive line total (uses stored lineTotal when set, else qty × unit).
 */
export function linesReadyForPurchaseInvoice(lines: OrderLine[]): boolean {
  if (lines.length === 0) return false;
  return lines.every((line) => {
    if (validateLineQuantity(line.kg, line.gram, line.piece) != null) return false;
    const unit = Number(line.unitPrice);
    if (!Number.isFinite(unit) || unit <= 0) return false;
    const explicit = line.lineTotal;
    const computed = computePurchaseLineTotal(line, unit);
    const effective =
      explicit != null && Number.isFinite(Number(explicit)) && Number(explicit) > 0
        ? Number(explicit)
        : computed;
    return effective > 0;
  });
}

export function computeBillingTotalsFromCategoryMarkup(
  order: Order,
  categoryMarkups: Record<string, number>,
): { purchaseSubtotal: number; billingSubtotal: number; grandTotal: number } {
  const purchaseSubtotal = order.lines.reduce((sum, line) => sum + Number(line.lineTotal ?? 0), 0);
  const billingSubtotal = order.lines.reduce((sum, line) => {
    const purchaseLine = Number(line.lineTotal ?? 0);
    const pct = Number(categoryMarkups[line.categoryId] ?? 0);
    const billedLine = purchaseLine + Math.round(purchaseLine * (pct / 100));
    return sum + billedLine;
  }, 0);
  return { purchaseSubtotal, billingSubtotal, grandTotal: billingSubtotal };
}
