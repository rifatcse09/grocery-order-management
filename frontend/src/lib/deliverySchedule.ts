import type { Order } from "../types";

/** Static scheduled delivery label for lists (no timers). */
export function formatDeliveryScheduleLabel(order: Order): string {
  const d = order.deliveryDate?.trim() ?? "—";
  const t = order.deliveryTime?.trim();
  if (!t) return d;
  const short = t.includes("T") ? t.replace(/^(\d{4}-\d{2}-\d{2})T/, "").split(/\s+(?:to|–|—|-)/i)[0] : t;
  return `${d} · ${short}`;
}
