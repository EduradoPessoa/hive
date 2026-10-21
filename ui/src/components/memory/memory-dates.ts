/**
 * Memory documents show when they were created and last updated, in the same
 * `DD/MM/YYYY HH:mm` Brasília-time form the memory-documents skill writes into
 * each document's header, so the page and the body never disagree on format.
 */
const MEMORY_TIME_ZONE = "America/Sao_Paulo";

const formatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: MEMORY_TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** `null` for a missing or unparseable value, so callers can omit the label. */
export function formatMemoryTimestamp(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = Object.fromEntries(
    formatter.formatToParts(date).map((part) => [part.type, part.value]),
  );
  return `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute}`;
}
