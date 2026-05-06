/** Map Western digits to Bengali (০–৯) for invoices and Bangla UI. */

const DIGIT_MAP: Record<string, string> = {
  "0": "০",
  "1": "১",
  "2": "২",
  "3": "৩",
  "4": "৪",
  "5": "৫",
  "6": "৬",
  "7": "৭",
  "8": "৮",
  "9": "৯",
};

export function toBanglaDigits(input: string): string {
  return input.replace(/[0-9]/g, (d) => DIGIT_MAP[d] ?? d);
}

/** Formatted amount with grouping; digits converted to Bengali (commas stay ASCII). */
export function formatMoneyBn(
  n: number,
  options?: { minFractionDigits?: number; maxFractionDigits?: number },
): string {
  const min = options?.minFractionDigits ?? 2;
  const max = options?.maxFractionDigits ?? 2;
  const formatted = n.toLocaleString("en-US", {
    minimumFractionDigits: min,
    maximumFractionDigits: max,
  });
  return toBanglaDigits(formatted);
}
