/** Weight (kg and/or g) OR pieces only — not both at once. */

export function parseQty(s: string): number {
  const n = parseFloat(String(s).replace(",", ".").trim());
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function validateLineQuantity(kg: string, gram: string, piece: string): string | null {
  const k = parseQty(kg);
  const g = parseQty(gram);
  const p = parseQty(piece);
  const hasWeight = k > 0 || g > 0;
  const hasPiece = p > 0;
  if (!hasWeight && !hasPiece) {
    return "Enter kg and/or grams, or pieces only (কেজি/গ্রাম অথবা শুধু পিচ).";
  }
  if (hasWeight && hasPiece) {
    return "Cannot mix weight and pieces (ওজন ও পিচ একসাথে নয়).";
  }
  return null;
}

export function hoursUntilDelivery(deliveryIsoDate: string): number {
  const d = new Date(deliveryIsoDate + "T23:59:59");
  return (d.getTime() - Date.now()) / (1000 * 60 * 60);
}

export function canEditOrder(deliveryIsoDate: string): boolean {
  return hoursUntilDelivery(deliveryIsoDate) >= 48;
}
