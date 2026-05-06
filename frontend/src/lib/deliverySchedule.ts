import type { Order } from "../types";
import { formatDeliveryTimeOnly, formatDeliveryWindow } from "./deliveryWindow";

/** Static scheduled delivery label for lists (no timers). */
export function formatDeliveryScheduleLabel(order: Order): string {
  return formatDeliveryWindow(order.deliveryTime, order.deliveryDate);
}

export function formatDeliveryDateLabel(order: Order): string {
  const raw = (order.deliveryDate ?? "").trim();
  if (!raw) return "—";
  const d = new Date(`${raw}T00:00:00`);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString(undefined, { dateStyle: "medium" });
}

export function formatDeliveryTimeWindowLabel(order: Order): string {
  return formatDeliveryTimeOnly(order.deliveryTime);
}
