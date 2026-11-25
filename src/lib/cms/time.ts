const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000;

export function formatJakartaDate(isoUtc: string | null | undefined): string {
  if (!isoUtc) return "";
  const date = new Date(isoUtc);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatJakartaDateTime(isoUtc: string | null | undefined): string {
  if (!isoUtc) return "—";
  const date = new Date(isoUtc);
  if (Number.isNaN(date.getTime())) return "—";
  return (
    new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date) + " WIB"
  );
}

/**
 * Converts a UTC ISO string into "YYYY-MM-DDTHH:mm" in Asia/Jakarta for <input type="datetime-local">.
 */
export function utcIsoToJakartaInputValue(isoUtc: string | null | undefined): string {
  if (!isoUtc) return "";
  const ms = Date.parse(isoUtc);
  if (Number.isNaN(ms)) return "";
  const jakarta = new Date(ms + JAKARTA_OFFSET_MS);
  return jakarta.toISOString().slice(0, 16);
}

/**
 * Converts a "YYYY-MM-DDTHH:mm" Asia/Jakarta datetime string into a UTC ISO string.
 */
export function jakartaInputValueToUtcIso(localValue: string | null | undefined): string | null {
  const trimmed = localValue?.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) {
    const parsed = Date.parse(trimmed);
    return Number.isNaN(parsed) ? null : new Date(parsed).toISOString();
  }
  const [, y, m, d, hh, mm] = match;
  const utcMs = Date.UTC(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm)) - JAKARTA_OFFSET_MS;
  return new Date(utcMs).toISOString();
}
