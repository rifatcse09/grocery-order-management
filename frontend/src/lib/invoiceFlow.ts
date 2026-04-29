import type { Order } from "../types";

export function hasPurchaseInvoice(order: Order): boolean {
  return Boolean(order.purchaseInvoiceGenerated);
}

export function hasBillingInvoice(order: Order): boolean {
  return Boolean(order.billingInvoiceGenerated || order.invoiceGenerated || order.status === "invoiced");
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
