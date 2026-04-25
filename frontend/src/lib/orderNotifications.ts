import type { Order } from "../types";

const KEY_ADMIN = "gom_admin_notify_order_ids";
const KEY_MOD_SEEN = "gom_moderator_seen_order_ids";

export const NOTIFICATIONS_EVENT = "gom-notifications-changed";

function dispatch() {
  window.dispatchEvent(new CustomEvent(NOTIFICATIONS_EVENT));
}

export function readAdminNotifyOrderIds(): string[] {
  try {
    const raw = localStorage.getItem(KEY_ADMIN);
    if (!raw) return [];
    const arr = JSON.parse(raw) as unknown;
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** Call when moderator saves order updates (e.g. after pricing) so admin can review. */
export function flagOrderForAdminReview(orderId: string) {
  const cur = readAdminNotifyOrderIds();
  if (cur.includes(orderId)) {
    dispatch();
    return;
  }
  cur.push(orderId);
  localStorage.setItem(KEY_ADMIN, JSON.stringify(cur));
  dispatch();
}

/** Call when admin opens an order detail — clears the “new” flag for that order. */
export function clearAdminOrderNotification(orderId: string) {
  const next = readAdminNotifyOrderIds().filter((id) => id !== orderId);
  localStorage.setItem(KEY_ADMIN, JSON.stringify(next));
  dispatch();
}

export function readModeratorSeenOrderIds(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY_MOD_SEEN);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as unknown;
    return new Set(Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : []);
  } catch {
    return new Set();
  }
}

/** Call when moderator opens an order detail page. */
export function markModeratorSeenOrder(orderId: string) {
  const s = readModeratorSeenOrderIds();
  if (s.has(orderId)) {
    dispatch();
    return;
  }
  s.add(orderId);
  localStorage.setItem(KEY_MOD_SEEN, JSON.stringify([...s]));
  dispatch();
}

/** Submitted orders the moderator has not opened yet (for header badge). */
export function moderatorNewSubmittedCount(orders: Order[]): number {
  const seen = readModeratorSeenOrderIds();
  return orders.filter((o) => o.status === "submitted" && !seen.has(o.id)).length;
}

/** True if moderator saved pricing-like data (unit price or line total on any line). */
export function orderHasPricingData(order: Order): boolean {
  return order.lines.some(
    (l) => (l.unitPrice != null && l.unitPrice > 0) || (l.lineTotal != null && l.lineTotal > 0),
  );
}
