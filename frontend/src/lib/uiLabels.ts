import { toBanglaDigits } from "./banglaNumerals";

/** English-first UI; Bangla in parentheses for measurements / table map. */

export const COL = {
  serial: "Serial (ক্রমিক নং)",
  category: "Category (ধরন)",
  item: "Item (বস্তু)",
  kg: "Kg (কেজি)",
  gram: "g (গ্রাম)",
  piece: "Pcs (পিস)",
  unitPrice: "Unit price",
  lineTotal: "Items total",
} as const;

/** Presentation only — never show DB `categories.code` / `catalog_items.code` to users. */
export const UNKNOWN_CATEGORY_LABEL = "Unknown category";
export const UNKNOWN_ITEM_LABEL = "Unknown item";
export const UNCATEGORIZED_LABEL = "Uncategorized";
export const UNNAMED_CATEGORY_LABEL = "Unnamed category";

/** Quantity string for tables — English units. */
export function formatQtyLine(kg: string, gram: string, piece: string): string {
  const k = parseFloat(String(kg).replace(",", ".")) || 0;
  const g = parseFloat(String(gram).replace(",", ".")) || 0;
  const p = parseFloat(String(piece).replace(",", ".")) || 0;
  if (p > 0) return `${format2(p)} pcs`;
  const parts: string[] = [];
  if (k > 0) parts.push(`${format2(k)} kg`);
  if (g > 0) parts.push(`${format2(g)} g`);
  return parts.join(" + ") || "—";
}

function format2(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Same as {@link formatQtyLine} with Western digits replaced by Bengali (invoice / Bangla print). */
export function formatQtyLineBn(kg: string, gram: string, piece: string): string {
  return toBanglaDigits(formatQtyLine(kg, gram, piece));
}
