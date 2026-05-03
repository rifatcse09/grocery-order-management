/** English-first UI; Bangla in parentheses for measurements / table map. */

export const COL = {
  serial: "Serial (ক্রমিক নং)",
  category: "Category (ধরন)",
  item: "Item (বস্তু)",
  kg: "Kg (কেজি)",
  gram: "g (গ্রাম)",
  piece: "Pcs (পিচ)",
  unitPrice: "Unit price",
  lineTotal: "Line total",
} as const;

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
