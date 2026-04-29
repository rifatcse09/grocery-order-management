const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATE_TIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

function isIsoDateOrDateTime(value: string): boolean {
  return ISO_DATE_RE.test(value) || ISO_DATE_TIME_RE.test(value);
}

export function parseDeliveryWindow(input?: string): {
  startDate: string;
  endDate: string;
} {
  const value = (input ?? "").trim();
  if (!value) return { startDate: "", endDate: "" };

  const matched = value.match(
    /^(\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2})?)\s*(?:to|–|—|-)\s*(\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2})?)$/i,
  );
  if (matched) {
    return { startDate: matched[1], endDate: matched[2] };
  }

  if (isIsoDateOrDateTime(value)) {
    return { startDate: value, endDate: value };
  }

  return { startDate: "", endDate: "" };
}

export function buildDeliveryWindow(startDate: string, endDate: string): string | undefined {
  const start = startDate.trim();
  const end = endDate.trim();
  if (!start && !end) return undefined;
  if (start && end) return `${start} to ${end}`;
  return start || end;
}

export function formatDeliveryWindow(input?: string): string {
  const value = (input ?? "").trim();
  if (!value) return "—";

  const { startDate, endDate } = parseDeliveryWindow(value);
  if (!startDate && !endDate) return value;
  if (startDate && endDate) return startDate === endDate ? startDate : `${startDate} to ${endDate}`;
  return startDate || endDate;
}
