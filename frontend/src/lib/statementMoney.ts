/** Round to 2 decimals (paisa) for statement math. */
export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Balance due for statement tables (whole-taka display).
 * Payments/adjustments are whole numbers; hide sub-1 taka leftovers so UI does not show "Balance 1"
 * for tiny fractions (e.g. 0.40 after rounding).
 */
export function statementBalanceDue(totalDue: number, paid: number): number {
  const due = roundMoney(totalDue);
  const p = roundMoney(Math.max(0, paid));
  if (p <= 0) return due;
  if (Math.round(p) >= Math.round(due)) return 0;
  const raw = Math.max(0, due - p);
  if (raw < 1) return 0;
  return roundMoney(raw);
}

export function statementPaymentStatus(
  totalDue: number,
  paid: number,
): "Paid" | "Partial" | "Unpaid" {
  const p = roundMoney(Math.max(0, paid));
  if (p <= 0) return "Unpaid";
  if (statementBalanceDue(totalDue, paid) <= 0) return "Paid";
  return "Partial";
}

/** Format ৳ for statement UI (whole taka; balance already cleared of sub-1 fractions). */
export function formatStatementTaka(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

/** Same rule as Pending bills / Outstanding bills — whole taka per invoice. */
export function pendingBillRemainingTaka(cap: number, netPaid: number): number {
  return Math.max(0, Math.round(cap) - Math.round(netPaid));
}

/** Sum billing invoice amounts in whole taka (avoids 142204 vs 142203 drift from decimals). */
export function billingInvoiceAmountTaka(amount: number): number {
  return Math.round(Number(amount) || 0);
}
