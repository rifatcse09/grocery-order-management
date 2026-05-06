import type { Order } from "../types";

/** Shown in admin/moderator lists when the customer submitted the order (not draft). */
export function formatOrderSubmittedAt(order: Order): string {
  if (order.status === "draft") return "—";
  if (order.submittedAt) {
    const d = new Date(order.submittedAt);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
    }
  }
  return order.orderDate || "—";
}

/** Saved timestamp shown in lists; falls back to orderDate on old rows. */
export function formatOrderSavedAt(order: Order): string {
  const source = order.createdAt || order.orderDate;
  if (!source) return "—";
  const d = new Date(source);
  if (Number.isNaN(d.getTime())) return source;
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}
