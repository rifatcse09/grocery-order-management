import type { Order } from "../types";

export function nextOrderNo(orders: Order[]): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const prefix = `ORD-${ymd}-`;
  let max = 0;
  for (const o of orders) {
    if (o.orderNo.startsWith(prefix)) {
      const tail = parseInt(o.orderNo.slice(prefix.length), 10);
      if (Number.isFinite(tail)) max = Math.max(max, tail);
    }
  }
  return `${prefix}${String(max + 1).padStart(3, "0")}`;
}

export function todayIsoDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
