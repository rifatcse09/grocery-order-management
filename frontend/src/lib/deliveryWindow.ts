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
  const fmt = (raw: string) => {
    const normalized = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T00:00` : raw;
    const d = new Date(normalized);
    if (Number.isNaN(d.getTime())) return raw;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours24 = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const ampm = hours24 >= 12 ? "PM" : "AM";
    const hours12 = hours24 % 12 || 12;
    return `${day}-${month}-${year}, ${hours12}:${minutes} ${ampm}`;
  };
  if (startDate && endDate) return startDate === endDate ? fmt(startDate) : `${fmt(startDate)} to ${fmt(endDate)}`;
  return fmt(startDate || endDate);
}
