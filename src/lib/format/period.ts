import { formatDate } from "./datetime";

export type PeriodSelection =
  | { kind: "month"; month: string }
  | { kind: "range"; start: string; end: string };

// Timestamps follow the product timezone, regardless of browser timezone.
export function dateKey(value: string) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));
  return ["year", "month", "day"]
    .map((type) => parts.find((part) => part.type === type)!.value)
    .join("-");
}

// Calendar cells represent dates, not instants. Avoid UTC conversion here.
export function calendarDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function calendarDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

export function rangeLabel(start: string, end: string) {
  const label = (value: string) =>
    formatDate(`${value}T12:00:00+07:00`, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  return start === end ? label(start) : `${label(start)} – ${label(end)}`;
}
